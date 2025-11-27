import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Search users by username to add as contacts
    Args: event - dict with httpMethod, queryStringParameters (query, current_user_id)
          context - object with request_id attribute
    Returns: HTTP response with list of matching users
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters', {})
    query = params.get('query', '').strip()
    current_user_id = params.get('current_user_id')
    
    if not query:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Search query is required'})
        }
    
    if not current_user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'current_user_id is required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'})
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    search_pattern = query.replace("'", "''")
    
    cursor.execute(f"""
        SELECT 
            u.id,
            u.username,
            u.full_name,
            u.avatar_url,
            u.online_status,
            CASE WHEN c.id IS NOT NULL THEN true ELSE false END as is_contact
        FROM users u
        LEFT JOIN contacts c ON c.user_id = {current_user_id} AND c.contact_user_id = u.id
        WHERE u.username ILIKE '%{search_pattern}%'
        AND u.id != {current_user_id}
        ORDER BY u.username
        LIMIT 20
    """)
    
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    
    users_list = [dict(user) for user in users]
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'users': users_list})
    }
