import json
import os
from typing import Dict, Any, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, Field

class CreateChatRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    chat_type: str = Field(..., pattern='^(direct|group|channel)$')
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    member_ids: List[int] = Field(default_factory=list)

class SendMessageRequest(BaseModel):
    chat_id: int = Field(..., gt=0)
    sender_id: int = Field(..., gt=0)
    message_type: str = Field(default='text', pattern='^(text|image|video|audio|file)$')
    content: Optional[str] = None
    media_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None

class UpdateProfileRequest(BaseModel):
    user_id: int = Field(..., gt=0)
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = None

def create_chat(body_data: Dict, conn) -> Dict:
    req = CreateChatRequest(**body_data)
    
    if req.chat_type in ['group', 'channel'] and not req.name:
        return {'statusCode': 400, 'error': 'Name is required for groups and channels'}
    
    cursor = conn.cursor()
    
    name_escaped = req.name.replace("'", "''") if req.name else 'NULL'
    desc_escaped = req.description.replace("'", "''") if req.description else 'NULL'
    name_value = f"'{name_escaped}'" if req.name else 'NULL'
    desc_value = f"'{desc_escaped}'" if req.description else 'NULL'
    
    cursor.execute(f"""
        INSERT INTO chats (type, name, description, created_by)
        VALUES ('{req.chat_type}', {name_value}, {desc_value}, {req.user_id})
        RETURNING id
    """)
    
    chat_id = cursor.fetchone()[0]
    
    cursor.execute(f"""
        INSERT INTO chat_members (chat_id, user_id, role)
        VALUES ({chat_id}, {req.user_id}, 'owner')
    """)
    
    for member_id in req.member_ids:
        if member_id != req.user_id:
            cursor.execute(f"""
                INSERT INTO chat_members (chat_id, user_id, role)
                VALUES ({chat_id}, {member_id}, 'member')
                ON CONFLICT (chat_id, user_id) DO NOTHING
            """)
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'data': {
            'chat_id': chat_id,
            'type': req.chat_type,
            'name': req.name,
            'description': req.description
        }
    }

def list_chats(params: Dict, conn) -> Dict:
    user_id = params.get('user_id')
    chat_type = params.get('type', '')
    
    if not user_id:
        return {'statusCode': 400, 'error': 'user_id is required'}
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    type_filter = ''
    if chat_type:
        chat_type_escaped = chat_type.replace("'", "''")
        type_filter = f"AND c.type = '{chat_type_escaped}'"
    
    cursor.execute(f"""
        SELECT 
            c.id,
            c.type,
            c.name,
            c.description,
            c.avatar_url,
            c.created_by,
            to_char(c.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at,
            (SELECT json_build_object(
                'id', m.id,
                'content', m.content,
                'message_type', m.message_type,
                'sender_id', m.sender_id,
                'created_at', to_char(m.created_at, 'YYYY-MM-DD HH24:MI:SS')
            )
            FROM messages m
            WHERE m.chat_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1) as last_message
        FROM chats c
        INNER JOIN chat_members cm ON cm.chat_id = c.id
        WHERE cm.user_id = {user_id} {type_filter}
        ORDER BY c.updated_at DESC
    """)
    
    chats = cursor.fetchall()
    cursor.close()
    
    return {'statusCode': 200, 'data': {'chats': [dict(chat) for chat in chats]}}

def send_message(body_data: Dict, conn) -> Dict:
    req = SendMessageRequest(**body_data)
    
    if req.message_type == 'text' and not req.content:
        return {'statusCode': 400, 'error': 'Content is required for text messages'}
    
    cursor = conn.cursor()
    
    cursor.execute(f"""
        SELECT 1 FROM chat_members WHERE chat_id = {req.chat_id} AND user_id = {req.sender_id}
    """)
    
    if not cursor.fetchone():
        cursor.close()
        return {'statusCode': 403, 'error': 'User is not a member of this chat'}
    
    content_escaped = req.content.replace("'", "''") if req.content else 'NULL'
    media_escaped = req.media_url.replace("'", "''") if req.media_url else 'NULL'
    file_name_escaped = req.file_name.replace("'", "''") if req.file_name else 'NULL'
    
    content_value = f"'{content_escaped}'" if req.content else 'NULL'
    media_value = f"'{media_escaped}'" if req.media_url else 'NULL'
    file_name_value = f"'{file_name_escaped}'" if req.file_name else 'NULL'
    file_size_value = str(req.file_size) if req.file_size else 'NULL'
    
    cursor.execute(f"""
        INSERT INTO messages (chat_id, sender_id, message_type, content, media_url, file_name, file_size)
        VALUES ({req.chat_id}, {req.sender_id}, '{req.message_type}', {content_value}, {media_value}, {file_name_value}, {file_size_value})
        RETURNING id, created_at
    """)
    
    result = cursor.fetchone()
    message_id = result[0]
    created_at = result[1].isoformat()
    
    cursor.execute(f"""
        UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = {req.chat_id}
    """)
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'data': {
            'message_id': message_id,
            'chat_id': req.chat_id,
            'sender_id': req.sender_id,
            'message_type': req.message_type,
            'content': req.content,
            'media_url': req.media_url,
            'file_name': req.file_name,
            'file_size': req.file_size,
            'created_at': created_at
        }
    }

def list_messages(params: Dict, conn) -> Dict:
    chat_id = params.get('chat_id')
    limit = params.get('limit', '50')
    offset = params.get('offset', '0')
    
    if not chat_id:
        return {'statusCode': 400, 'error': 'chat_id is required'}
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute(f"""
        SELECT 
            m.id,
            m.chat_id,
            m.sender_id,
            m.message_type,
            m.content,
            m.media_url,
            m.file_name,
            m.file_size,
            to_char(m.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
            u.username,
            u.full_name,
            u.avatar_url
        FROM messages m
        INNER JOIN users u ON u.id = m.sender_id
        WHERE m.chat_id = {chat_id}
        ORDER BY m.created_at DESC
        LIMIT {limit} OFFSET {offset}
    """)
    
    messages = cursor.fetchall()
    cursor.close()
    
    messages_list = [dict(msg) for msg in messages]
    messages_list.reverse()
    
    return {'statusCode': 200, 'data': {'messages': messages_list}}

def update_profile(body_data: Dict, conn) -> Dict:
    req = UpdateProfileRequest(**body_data)
    
    cursor = conn.cursor()
    
    update_fields = []
    
    if req.username:
        username_escaped = req.username.replace("'", "''")
        cursor.execute(f"SELECT id FROM users WHERE username = '{username_escaped}' AND id != {req.user_id}")
        if cursor.fetchone():
            cursor.close()
            return {'statusCode': 400, 'error': 'Username already taken'}
        update_fields.append(f"username = '{username_escaped}'")
    
    if req.full_name:
        full_name_escaped = req.full_name.replace("'", "''")
        update_fields.append(f"full_name = '{full_name_escaped}'")
    
    if req.bio is not None:
        bio_escaped = req.bio.replace("'", "''")
        update_fields.append(f"bio = '{bio_escaped}'")
    
    if req.avatar_url is not None:
        avatar_escaped = req.avatar_url.replace("'", "''")
        update_fields.append(f"avatar_url = '{avatar_escaped}'")
    
    if not update_fields:
        return {'statusCode': 400, 'error': 'No fields to update'}
    
    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    
    cursor.execute(f"""
        UPDATE users
        SET {', '.join(update_fields)}
        WHERE id = {req.user_id}
        RETURNING id, username, email, full_name, avatar_url, bio, online_status
    """)
    
    user = cursor.fetchone()
    
    if not user:
        cursor.close()
        return {'statusCode': 404, 'error': 'User not found'}
    
    conn.commit()
    cursor.close()
    
    user_data = {
        'id': user[0],
        'username': user[1],
        'email': user[2],
        'full_name': user[3],
        'avatar_url': user[4],
        'bio': user[5],
        'online_status': user[6]
    }
    
    return {'statusCode': 200, 'data': {'user': user_data}}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Unified messenger API for chats and messages
    Args: event - dict with httpMethod, queryStringParameters, body
          context - object with request_id attribute
    Returns: HTTP response with requested data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'})
        }
    
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            action = params.get('action', '')
            
            if action == 'list_chats':
                result = list_chats(params, conn)
            elif action == 'list_messages':
                result = list_messages(params, conn)
            else:
                result = {'statusCode': 400, 'error': 'Invalid action'}
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', '')
            
            if action == 'create_chat':
                result = create_chat(body_data, conn)
            elif action == 'send_message':
                result = send_message(body_data, conn)
            elif action == 'update_profile':
                result = update_profile(body_data, conn)
            else:
                result = {'statusCode': 400, 'error': 'Invalid action'}
        else:
            result = {'statusCode': 405, 'error': 'Method not allowed'}
        
        conn.close()
        
        if 'error' in result:
            return {
                'statusCode': result['statusCode'],
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': result['error']})
            }
        
        return {
            'statusCode': result['statusCode'],
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(result['data'])
        }
    
    except Exception as e:
        conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }