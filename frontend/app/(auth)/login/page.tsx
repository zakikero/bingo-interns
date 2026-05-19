import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login | Fika Bingo",
};

export default function LoginPage() {
  return (
    <div className="auth-card">
      <p className="eyebrow" style={{ textAlign: "center" }}>
        FIKA BINGO
      </p>
      <h1 className="welcome-title">Hey, ready to have fun ?!</h1>
      <p className="intro-text">
        Track your activities, upload proof, and complete your Fika Bingo board.
        May the odds be ever in your favor.
      </p>
      <LoginForm />
    </div>
  );
}
