# mobile-event-push

JWT-protected Edge Function used by the native app after a mobile-originated message or job application.

The function verifies the signed-in user owns the source action before deriving the recipient, inserting a platform notification and sending to active Expo push tokens.

Supported events:
- `new_message`
- `job_application`

The function is deployed with `verify_jwt=true`. Expo enhanced-security access tokens are optional and read from `EXPO_ACCESS_TOKEN` when configured.
