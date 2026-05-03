import { useState } from "react";

export default function UserAvatar({ name, email, className, fallbackClassName }) {
  const [error, setError] = useState(false);
  
  if (error || !email) {
    return (
      <div className={fallbackClassName}>
        {name?.charAt(0)?.toUpperCase() || "U"}
      </div>
    );
  }

  return (
    <img 
      src={`http://${window.location.hostname}:5000/student/${email}/photo`} 
      alt={name || "User"} 
      className={className}
      onError={() => setError(true)}
    />
  );
}
