import { Lock } from 'lucide-react'

export default function PlaceholderCard({ title, message }) {
  return (
    <div className="placeholder-card">
      <Lock size={28} />
      <h3>{title || 'Coming Soon'}</h3>
      <p>{message || 'This feature will be built in a future phase.'}</p>
    </div>
  )
}
