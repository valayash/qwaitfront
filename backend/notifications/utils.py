from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import logging
import re

logger = logging.getLogger(__name__)

def format_phone_for_notifications(phone_number_str):
    """
    Prepares a phone number for notification services (e.g., Twilio E.164 format).
    Assumes US numbers if no country code is apparent.
    """
    digits = re.sub(r'\D', '', phone_number_str)
    if len(digits) == 10: # Assume US number without country code
        return f"+1{digits}"
    elif len(digits) == 11 and digits.startswith('1'): # US number with 1 prefix
        return f"+{digits}"
    elif digits.startswith('+'): # Already in some international format
        return digits
    else: # Unknown format, try to prefix with + if it looks like it might be a full number with country code
        # This is a basic guess; robust international phone number validation is complex.
        if len(digits) > 10:
            return f"+{digits}"
    return phone_number_str # Fallback to original if unsure

def send_email_notification(
    recipient_list,
    subject,
    text_template_path,
    html_template_path,
    context,
    from_email=None
):
    """Generic function to send an email notification."""
    if not getattr(settings, 'EMAIL_ENABLED', False):
        logger.info("Email notifications are disabled in settings.")
        return False

    if not from_email:
        from_email = settings.DEFAULT_FROM_EMAIL

    try:
        html_message = render_to_string(html_template_path, context)
        plain_message = render_to_string(text_template_path, context)

        send_mail(
            subject,
            plain_message,
            from_email,
            recipient_list,
            html_message=html_message,
            fail_silently=False
        )
        logger.info(f"Email sent to {recipient_list} with subject '{subject}'.")
        return True
    except Exception as e:
        logger.error(f"Error sending email to {recipient_list} with subject '{subject}': {str(e)}")
        return False

def send_sms_via_twilio(to_phone_number, body):
    """Sends an SMS using Twilio."""
    if not getattr(settings, 'SMS_ENABLED', False):
        logger.info("SMS notifications are disabled in settings.")
        return {"success": False, "error": "sms_disabled"}

    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
    twilio_from_number = getattr(settings, 'TWILIO_FROM_NUMBER', None)

    if not all([account_sid, auth_token, twilio_from_number]):
        logger.error("Twilio settings (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER) are not configured.")
        return {"success": False, "error": "twilio_config_error"}

    try:
        from twilio.rest import Client
    except ImportError:
        logger.error("Twilio Python library is not installed. pip install twilio")
        return {"success": False, "error": "twilio_not_installed"}

    client = Client(account_sid, auth_token)
    formatted_to_number = format_phone_for_notifications(to_phone_number)

    try:
        message = client.messages.create(
            body=body,
            from_=twilio_from_number,
            to=formatted_to_number
        )
        logger.info(f"SMS sent to {formatted_to_number} via Twilio. SID: {message.sid}")
        return {"success": True, "sid": message.sid, "status": message.status}
    except Exception as e:
        logger.error(f"Twilio SMS sending failed to {formatted_to_number}: {str(e)}")
        # Consider parsing TwilioException for more specific error codes if available
        return {"success": False, "error": "twilio_send_error", "details": str(e)} 