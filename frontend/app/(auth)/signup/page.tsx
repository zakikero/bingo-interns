import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Sign Up | Fika Bingo",
};

export default function SignupPage() {
  return (
    <div className="auth-card">
      <p className="eyebrow" style={{ textAlign: "center" }}>
        FIKA BINGO
      </p>
      <h1 className="welcome-title">Join the fun!</h1>
      <p className="intro-text">
        Create your account to start tracking activities and complete your Fika
        Bingo board. May the odds be ever in your favor.
      </p>
      <SignupForm />
    </div>
  );
}
