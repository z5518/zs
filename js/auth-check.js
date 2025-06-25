// auth-check.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 初始化 Supabase
const supabase = createClient(
  "https://tgybhckhjbmeafruvokc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRneWJoY2toamJtZWFmcnV2b2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODc5ODQsImV4cCI6MjA2NjM2Mzk4NH0.OWNrddp4hhZRSaCpH4NGRtoRB54hUcWDbfMEhi9Adfg"
);

// 检查登录状态
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) {
  window.location.href = "index.html";  // 未登录就跳转回登录页
}
