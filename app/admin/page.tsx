export default function AdminDashboardPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        textAlign: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div>
        <h1>Admin Dashboard</h1>
        <p>Admin root route is now connected successfully.</p>
        <p>Login and post-login redirect are functioning.</p>
      </div>
    </div>
  );
}
