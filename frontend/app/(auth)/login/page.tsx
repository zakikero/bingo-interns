import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login | Internship Bingo",
};

export default function LoginPage() {
  return (
    <div className="auth-card">
      <p className="eyebrow" style={{ textAlign: "center" }}>
        INTERNSHIP BINGO
      </p>
      <h1 className="welcome-title">Hey, ready to have fun ?!</h1>
      <p className="intro-text">
        Track your activities, upload proof, and complete your Internship Bingo board. May the odds be ever in your
        favor.
      </p>
      <LoginForm />
    </div>
  );
}
