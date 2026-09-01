"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export default function Login(){
 const r=useRouter(),[email,setEmail]=useState('admin@salestrack.com'),[password,setPassword]=useState('123456'),[error,setError]=useState('');
 function submit(e:any){e.preventDefault();if(!email||!password){setError('Please enter email and password');return}r.push('/dashboard')}
 return <main className="auth"><form onSubmit={submit} className="loginCard"><div className="logo">Sales<span>Track</span></div><h1>Welcome back</h1><p>Sign in to your sales management system</p><label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} type="email"/><label>Password</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password"/>{error&&<div className="error">{error}</div>}<button className="primary full">Sign In</button><small>Demo mode • Connect Supabase credentials for live authentication</small></form></main>}