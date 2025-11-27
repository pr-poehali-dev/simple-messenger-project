import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import psycopg2
from psycopg2.extras import RealDictCursor

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)

def verify_password(stored_hash: str, provided_password: str) -> bool:
    try:
        salt, pwd_hash = stored_hash.split('$')
        computed_hash = hashlib.sha256((provided_password + salt).encode()).hexdigest()
        return computed_hash == pwd_hash
    except:
        return False

def generate_session_token() -> str:
    return secrets.token_urlsafe(32)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User login endpoint
    Args: event with httpMethod, body (username, password)
          context with request_id
    Returns: HTTP response with user data and session token
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        login_request = LoginRequest(**body_data)
        
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            raise ValueError('DATABASE_URL not configured')
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            """SELECT id, username, email, password_hash, full_name, avatar_url, created_at
               FROM users 
               WHERE username = %s OR email = %s""",
            (login_request.username, login_request.username)
        )
        user = cur.fetchone()
        
        if not user or not verify_password(user['password_hash'], login_request.password):
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid username or password'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            """UPDATE users 
               SET online_status = %s, last_seen = %s 
               WHERE id = %s""",
            (True, datetime.utcnow(), user['id'])
        )
        
        session_token = generate_session_token()
        expires_at = datetime.utcnow() + timedelta(days=30)
        
        cur.execute(
            """INSERT INTO sessions (user_id, session_token, expires_at)
               VALUES (%s, %s, %s)""",
            (user['id'], session_token, expires_at)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'avatar_url': user['avatar_url'],
                    'created_at': user['created_at'].isoformat() if user['created_at'] else None
                },
                'session_token': session_token
            }),
            'isBase64Encoded': False
        }
        
    except ValueError as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Internal server error', 'details': str(e)}),
            'isBase64Encoded': False
        }
