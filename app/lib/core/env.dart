/// Backend settings, overridable at build/run time:
///   flutter run --dart-define=SUPABASE_URL=https://xyz.supabase.co --dart-define=SUPABASE_ANON_KEY=...
///
/// Defaults point at the local Supabase stack (`supabase start`, API port 56321).
/// - iOS simulator / desktop: `127.0.0.1` works as is.
/// - Android emulator: the host machine is `10.0.2.2`, so run with
///   `--dart-define=SUPABASE_URL=http://10.0.2.2:56321`.
/// - Physical phone: use the Mac's LAN address, e.g. `http://192.168.1.20:56321`.
/// Only the anon key may ever ship in the app (never the service key).
abstract final class Env {
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL', defaultValue: 'http://127.0.0.1:56321');

  // Public local-stack anon key (Supabase CLI demo key); not a secret.
  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  );
}
