import os
import base64
from email.mime.text import MIMEText
from typing import Iterable
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Definimos que queremos enviar y modificar correos
SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.modify']

def get_gmail_service():
    creds = None
    # El archivo token.json guarda tus permisos para no loguearte cada vez
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Aquí es donde se usa el archivo que descargaste de Google Cloud
            flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return build('gmail', 'v1', credentials=creds)

def enviar_correo(destinatario: str, asunto: str, cuerpo: str):
    service = get_gmail_service()
    message = MIMEText(cuerpo)
    message['to'] = destinatario
    message['subject'] = asunto

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    try:
        service.users().messages().send(userId="me", body={'raw': raw}).execute()
        return True
    except Exception as e:
        print(f"Error enviando correo: {e}")
        return False


def enviar_correo_multiple(destinatarios: Iterable[str], asunto: str, cuerpo: str):
    service = get_gmail_service()
    lista = [email.strip() for email in destinatarios if email and email.strip()]
    if not lista:
        return False, "No hay destinatarios validos."

    message = MIMEText(cuerpo)
    message['to'] = ", ".join(lista)
    message['subject'] = asunto

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    try:
        service.users().messages().send(userId="me", body={'raw': raw}).execute()
        return True, None
    except Exception as e:
        error_msg = f"Error enviando correo multiple: {e}"
        print(error_msg)
        return False, error_msg