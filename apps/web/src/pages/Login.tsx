import { Navigate } from 'react-router-dom';

export default function Login() {
  // Redirect to landing page which will trigger onboarding for regular users
  return <Navigate to="/" replace />;
}
