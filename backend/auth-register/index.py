import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any
from pydantic import BaseModel, Field, EmailStr, field_validator
import psycopg2
from psycopg2.extras import RealDictCursor

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=255)
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, underscores and hyphens')
        return v.lower()

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${pwd_hash}"

def generate_session_token() -> str:
    return secrets.token_urlsafe(32)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User registration endpoint
    Args: event with httpMethod, body (username, email, password, full_name)
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
        reg_request = RegisterRequest(**body_data)
        
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            raise ValueError('DATABASE_URL not configured')
        
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            "SELECT id FROM users WHERE username = %s OR email = %s",
            (reg_request.username, reg_request.email)
        )
        existing_user = cur.fetchone()
        
        if existing_user:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username or email already exists'}),
                'isBase64Encoded': False
            }
        
        password_hash = hash_password(reg_request.password)
        
        cur.execute(
            """INSERT INTO users (username, email, password_hash, full_name, online_status, last_seen)
               VALUES (%s, %s, %s, %s, %s, %s)
               RETURNING id, username, email, full_name, avatar_url, created_at""",
            (
                reg_request.username,
                reg_request.email,
                password_hash,
                reg_request.full_name,
                True,
                datetime.utcnow()
            )
        )
        user = dict(cur.fetchone())
        
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
            'statusCode': 201,
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
