import json
import os
from typing import Dict, Any
import psycopg2
from pydantic import BaseModel, Field, ValidationError

class AddContactRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    contact_user_id: int = Field(..., gt=0)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Add a user to contacts list
    Args: event - dict with httpMethod, body (user_id, contact_user_id)
          context - object with request_id attribute
    Returns: HTTP response with success status
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    
    req = AddContactRequest(**body_data)
    
    if req.user_id == req.contact_user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Cannot add yourself as contact'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'})
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    cursor.execute(f"""
        INSERT INTO contacts (user_id, contact_user_id)
        VALUES ({req.user_id}, {req.contact_user_id})
        ON CONFLICT (user_id, contact_user_id) DO NOTHING
    """)
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'success': True, 'message': 'Contact added successfully'})
    }
