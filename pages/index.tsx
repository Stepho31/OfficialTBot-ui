// import { useState } from 'react';
// import { createCheckout } from '../lib/api';

// export default function Home() {
//   const [loading, setLoading] = useState(false);
//   const onStart = async () => {
//     try {
//       setLoading(true);
//       const url = await createCheckout();
//       window.location.href = url;
//     } catch (e:any) {
//       alert(e.message || 'Error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main style={{maxWidth: 720, margin: "60px auto", fontFamily: "Inter, system-ui, Arial"}}>
//       <h1>AutoPip AI</h1>
//       <p>Automated trades in your OANDA account. Your funds stay with you.</p>
//       <ol>
//         <li>Subscribe for $25/month</li>
//         <li>Set password / Login</li>
//         <li>Paste OANDA Account ID + token once</li>
//         <li>View your private dashboard</li>
//       </ol>
//       <button onClick={onStart} disabled={loading} style={{padding: "10px 16px"}}>
//         {loading ? "Starting..." : "Start $25/mo"}
//       </button>
//       <p style={{marginTop: 16}}><a href="/login">Developer Login</a></p>
//     </main>
//   );
// }
import { useEffect } from 'react';
import { useRouter } from 'next/router'; // If App Router, use `next/navigation`

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to the dashboard
    router.replace('/dashboard');
  }, [router]);

  return null; // Nothing to render since we redirect instantly
}
