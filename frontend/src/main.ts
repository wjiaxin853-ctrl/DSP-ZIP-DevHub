const icons={home:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',tools:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',environment:'<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',knowledge:'<path d="M12 6c-3-3-6-3-9-2v14c3-1 6-1 9 2m0-14c3-3 6-3 9-2v14c-3-1-6-1-9 2m0-14v14"/>',team:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1"/>'};icons.overview=icons.home;icons.home='<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M10 20v-6h4v6"/>';icons.repository='<circle cx="6" cy="4" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="6" cy="20" r="2"/><path d="M6 6v12M8 15c7 0 10-3 10-6"/>';icons.tasks='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';const navItems=[['home','首页'],['overview','总览'],['repository','仓库概览'],['tools','研发工具'],['environment','环境管理'],['knowledge','操作手册'],['team','团队介绍'],['tasks','定时任务']];const nav=document.querySelector('#nav');navItems.forEach(([id,name])=>{let b=document.createElement('button');b.dataset.go=id;b.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg><span>${name}</span>`;b.setAttribute('aria-label',name);nav.append(b)});function go(id){if(['overview','repository','tasks'].includes(id)&&window.extraPages)window.extraPages.mount(document.getElementById(id),id,go);document.querySelectorAll('#global-nav button').forEach(x=>x.classList.toggle('active',x.dataset.go===id));document.body.classList.toggle('manual-view',id==='knowledge');document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===id));nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.go===id));document.querySelectorAll('#manual-nav button').forEach(x=>x.classList.toggle('active',x.dataset.go===id));document.querySelector('#breadcrumb').textContent=navItems.find(x=>x[0]===id)[1];window.scrollTo(0,0)}document.querySelector('#global-nav').innerHTML=navItems.map(([id,name])=>`<button data-go="${id}" aria-label="${name}" title="${name}"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg></button>`).join('');document.querySelector('#global-user').onclick=()=>alert('个人信息尚未接入。');document.querySelector('#manual-nav').innerHTML=navItems.map(([id,name])=>`<button data-go="${id}" aria-label="${name}" title="${name}"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg></button>`).join('');document.querySelector('.manual-user').onclick=()=>alert('个人信息尚未接入。');document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go);if(e.target.closest('.demo-action'))alert('演示原型：此功能尚未接入。')});go('home');type ChatMessage = { role: 'user' | 'assistant'; content: string; failed?: boolean };
type ChatSession = { id: string; title: string; messages: ChatMessage[] };
const chatStorageKey = 'dsp-devhub-chat-v1';
const askForm = document.querySelector('#ask') as HTMLFormElement;
const questionInput = document.querySelector('#question') as HTMLInputElement;
const chatHint = document.querySelector('#home-hint') as HTMLElement;
const chatHistory = document.querySelector('#chat-history') as HTMLElement;
const sendButton = askForm.querySelector('button[type="submit"], button:not([type])') as HTMLButtonElement;
const homePage = document.querySelector('#home') as HTMLElement;
const chatSessions = document.querySelector('#chat-sessions') as HTMLElement;
const chatSidebar = document.querySelector('#chat-sidebar') as HTMLElement;
const historyToggle = document.querySelector('#chat-history-toggle') as HTMLButtonElement;
let sessions: ChatSession[] = [];
let currentChatId: string | null = null;
const pendingChats = new Set<string>();
const chatErrors = new Map<string, string>();
let storageWarning = '';
try {
  const saved = JSON.parse(localStorage.getItem(chatStorageKey) || '{}');
  if (Array.isArray(saved.sessions)) sessions = saved.sessions.filter((s: ChatSession) => s && typeof s.id === 'string' && typeof s.title === 'string' && Array.isArray(s.messages));
  if (sessions.some(s => s.id === saved.currentChatId)) currentChatId = saved.currentChatId;
} catch { storageWarning = '无法读取本地历史记录。'; }
function saveChats() {
  try { localStorage.setItem(chatStorageKey, JSON.stringify({ sessions, currentChatId })); }
  catch { storageWarning = '无法保存对话记录，请检查浏览器存储空间或权限。'; }
}
function currentSession(): ChatSession | undefined { return sessions.find(s => s.id === currentChatId); }
function renderChat() {
  const session = currentSession();
  homePage.classList.toggle('chat-active', !!session);
  chatSessions.replaceChildren();
  sessions.forEach(s => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chat-session' + (s.id === currentChatId ? ' active' : '');
    button.textContent = s.title;
    button.title = s.title;
    button.onclick = () => { currentChatId = s.id; questionInput.value = ''; chatSidebar.classList.remove('open'); historyToggle.setAttribute('aria-expanded', 'false'); saveChats(); renderChat(); };
    chatSessions.append(button);
  });
  chatHistory.replaceChildren();
  session?.messages.forEach((message, index) => {
    const item = document.createElement('div');
    item.className = 'chat-message chat-' + message.role;
    const label = document.createElement('strong');
    label.textContent = message.role === 'user' ? '你' : 'Qwen 3 · 0.6B';
    const body = document.createElement('div');
    body.textContent = message.content;
    item.append(label, body);
    if (message.failed && !pendingChats.has(session.id)) {
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'chat-retry'; retry.textContent = '发送失败，点击重试';
      retry.onclick = () => sendMessage(session, index);
      item.append(retry);
    }
    chatHistory.append(item);
  });
  const busy = !!session && pendingChats.has(session.id);
  sendButton.disabled = busy;
  chatHint.textContent = busy ? 'Qwen 正在思考，请稍候…' : (session && chatErrors.get(session.id)) || storageWarning;
  chatHistory.scrollTop = chatHistory.scrollHeight;
}
function newChat() {
  currentChatId = null;
  questionInput.value = '';
  chatSidebar.classList.remove('open');
  historyToggle.setAttribute('aria-expanded', 'false');
  saveChats(); renderChat(); questionInput.focus();
}
document.querySelector('#chat-new').addEventListener('click', newChat);
document.querySelector('#chat-new-label').addEventListener('click', newChat);
historyToggle.addEventListener('click', () => {
  const isOpen = chatSidebar.classList.toggle('open');
  historyToggle.setAttribute('aria-expanded', String(isOpen));
});
async function sendMessage(session: ChatSession, messageIndex: number) {
  if (pendingChats.has(session.id)) return;
  const message = session.messages[messageIndex];
  if (!message || message.role !== 'user') return;
  pendingChats.add(session.id);
  chatErrors.delete(session.id);
  message.failed = true;
  saveChats(); renderChat();
  try {
    const history = session.messages.slice(0, messageIndex).filter(m => !m.failed).slice(-18).map(({ role, content }) => ({ role, content }));
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [...history, { role: 'user', content: message.content }] }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '请求失败');
    if (typeof result.message !== 'string' || !result.message.trim()) throw new Error('模型未返回回答');
    delete message.failed;
    session.messages.splice(messageIndex + 1, 0, { role: 'assistant', content: result.message });
  } catch (error) {
    message.failed = true;
    chatErrors.set(session.id, '请求失败：' + (error instanceof Error ? error.message : '请检查 Ollama 服务'));
  } finally {
    pendingChats.delete(session.id);
    saveChats(); renderChat();
    if (session.id === currentChatId) questionInput.focus();
  }
}
askForm.onsubmit = (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) { chatHint.textContent = '请输入你想了解的问题。'; return; }
  let session = currentSession();
  if (!session) {
    session = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), title: question.slice(0, 32), messages: [] };
    sessions.unshift(session); currentChatId = session.id;
  }
  if (pendingChats.has(session.id)) return;
  session.messages.push({ role: 'user', content: question });
  questionInput.value = '';
  sendMessage(session, session.messages.length - 1);
};
renderChat();
document.querySelector('#attach').onclick=()=>document.querySelector('#home-hint').textContent='附件功能尚未接入。';document.querySelector('#user').onclick=()=>alert('个人信息尚未接入。');
const data={AI工具:[['Codex','代码助手，支持代码生成与任务执行','GitHub / 官网','v0.38.2','内网下载'],['Claude Code','终端 AI 编程助手','GitHub / 官网','v1.14.1','复制命令'],['Ollama','本地大模型运行与管理','GitHub / 官网','v0.6.1','内网下载'],['LM Studio','本地 LLM 运行与测试工具','官网','v0.3.11','内网下载'],['Open WebUI','开源本地大模型界面','GitHub / 官网','v0.5.20','复制命令'],['Dify','LLM 应用与工作流编排','GitHub / 官网','v1.7.0','内网下载']],软件下载:[['Visual Studio Code','macOS / Windows / Linux','v1.96.0','206 MB','2026-11-14'],['IntelliJ IDEA','macOS / Windows / Linux','v2025.2.3','1.20 GB','2026-11-10'],['Docker Desktop','macOS / Windows / Linux','v4.33.1','552 MB','2026-11-10'],['Git','macOS / Windows / Linux','v2.47.1','66 MB','2026-11-08'],['Postman','macOS / Windows','v11.22.0','154 MB','2026-11-07'],['ToDesk','Windows','v4.7.3','98 MB','2026-11-05']],公共脚本:[['deploy_env.sh','环境一键部署','Bash','a1b2c3d','王佳鑫'],['upgrade_dsp.sh','环境升级与包更新','Bash','f4e5d6c','张宇华'],['collect_log.sh','日志采集与打包','Bash','9c8b7a6','李明'],['check_env.py','环境健康检查与报告','Python','5d4c3b2','陈浩'],['clear_mr.sh','清理无用合并请求','Bash','e7f6d5c','赵磊'],['sync_wiki.py','本地 Markdown 同步到 Wiki','Python','b0a9f8e','周肌']]};const env=[['DSP-研发环境','开发环境','10.65.24.5.95','王佳鑫','空闲','DSP 3.0.36'],['DSP-稳定性测试','稳定性环境','10.65.24.5.96','张宇华','稳定性测试','DSP 3.0.36'],['XDRA 联调环境','联调环境','10.65.26.10','刘浩然','使用中','DSP 3.0.35'],['演示环境','演示环境','10.65.30.21','陈思雨','空闲','DSP 3.0.36'],['气象-研发环境','开发环境','10.87.31.12','李志鹏','使用中','DSP 3.0.36']];const docs=[['DSP 打包流水线使用说明','流水线打包','代码打包流水线的方法与参数配置','2026-01-14'],['3.0.36 升级问题排查手册','升级排查','升级常见问题与解决方案','2026-01-13'],['环境申请与使用规范','环境使用','各类环境的申请流程与使用规范','2026-01-12'],['ToDesk / 向日葵远程连接指引','环境使用','远程连接配置与常见问题处理','2026-01-11'],['TD 修改与提测流程说明','权限开通','提测申请与相关流程说明','2026-01-11'],['合并请求（MR）提交流程','开发规范','代码合并流程与评审要求','2026-01-10'],['DSP 开发 Rules 与编码规范','开发规范','编码规范与工程实践建议','2026-01-09'],['常用 AI 工具安装与命令汇总','AI提示词库','AI 工具安装配置与常用命令','2026-01-08'],['会议分享归档入口','会议分享','研发会议与技术分享资料','2026-01-07']];const names=['王佳鑫','张宇华','李志鹏','陈思雨','刘浩然','赵一鸣','孙悦','周子航','吴佳琪','郑博文','徐铭','韩雪','马文轩','朱可','高晨','梁玉','彭昱','谢珊','何宁','丁锐'];let tool='AI工具',envTab='全部环境',docTab='全部文档';function tabs(id,items,current,cb){const root=document.querySelector(id);root.replaceChildren(...items.map(x=>{let b=document.createElement('button');b.textContent=x;b.className=x===current?'active':'';b.onclick=()=>cb(x);return b}))}function table(id,heads,rows){const root=document.querySelector(id);let t=document.createElement('table'),h=document.createElement('thead'),tr=document.createElement('tr');heads.forEach(x=>{let th=document.createElement('th');th.textContent=x;tr.append(th)});h.append(tr);t.append(h);let body=document.createElement('tbody');rows.forEach(row=>{let tr=document.createElement('tr');row.forEach((v,i)=>{let td=document.createElement('td');td.textContent=v;if(['空闲','使用中','稳定性测试'].includes(v)){let s=document.createElement('span');s.className='badge '+(v==='空闲'?'green':v==='使用中'?'orange':'blue');s.textContent=v;td.replaceChildren(s)}tr.append(td)});body.append(tr)});t.append(body);root.replaceChildren(t);let f=document.createElement('div');f.className='table-footer';f.textContent=rows.length?'显示 '+rows.length+' 条示例':'没有找到匹配结果';root.append(f)}function toolsRender(){tabs('#tool-tabs',Object.keys(data),tool,x=>{tool=x;toolsRender()});let q=document.querySelector('#tool-search').value.trim().toLowerCase();let rows=data[tool].filter(r=>r.join(' ').toLowerCase().includes(q));let heads=tool==='AI工具'?['工具名称','用途说明','GitHub / 官网','版本','获取方式']:tool==='软件下载'?['软件名称','系统支持','版本','大小','更新时间']:['脚本名称','用途说明','语言','版本（提交号）','维护人'];table('#tool-table',heads,rows)}function envRender(){tabs('#env-tabs',['全部环境','开发环境','客户环境','测试环境','联调环境','稳定性环境','演示环境'],envTab,x=>{envTab=x;envRender()});let q=document.querySelector('#env-search').value.toLowerCase();table('#env-table',['环境名称','类型','地址 / 访问方式','负责人','环境状态','版本'],env.filter(r=>(envTab==='全部环境'||r[1]===envTab)&&r.join(' ').toLowerCase().includes(q)))}function manualTable(rows){const root=document.querySelector('#doc-table');const t=document.createElement('table');const h=document.createElement('thead');const hr=document.createElement('tr');['文档名称','分类','简介','更新时间','操作'].forEach(x=>{let th=document.createElement('th');th.textContent=x;hr.append(th)});h.append(hr);t.append(h);const body=document.createElement('tbody');rows.forEach((r)=>{const tr=document.createElement('tr');const title=document.createElement('td');const wrap=document.createElement('div');wrap.className='doc-title';const icon=document.createElement('span');let kind=r[0].includes('手册')?'pdf':r[0].includes('流程')||r[0].includes('指引')||r[0].includes('AI 工具')?'md':'word';icon.className='file-icon '+kind;icon.textContent=kind==='pdf'?'P':kind==='md'?'MD':'W';const name=document.createElement('span');name.textContent=r[0];wrap.append(icon,name);title.append(wrap);tr.append(title);const cat=document.createElement('td');const badge=document.createElement('span');badge.className='doc-category '+(r[1]==='环境使用'?'env':r[1]==='升级排查'?'upgrade':'');badge.textContent=r[1];cat.append(badge);tr.append(cat);[r[2],r[3]].forEach(v=>{let td=document.createElement('td');td.textContent=v;tr.append(td)});let actions=document.createElement('td');let box=document.createElement('div');box.className='doc-actions';['打开链接','复制链接','↗'].forEach(label=>{let b=document.createElement('button');b.textContent=label;b.setAttribute('aria-label',label+'：'+r[0]);b.onclick=()=>{document.querySelector('#doc-notice').textContent='该示例文档尚未关联真实链接。'};box.append(b)});actions.append(box);tr.append(actions);body.append(tr)});t.append(body);root.replaceChildren(t);if(!rows.length){let e=document.createElement('div');e.className='empty';e.textContent='没有找到匹配文档';root.append(e)}}function docRender(){tabs('#doc-tabs',['全部文档','流水线打包','升级排查','环境使用','权限开通','开发规范','会议分享','AI提示词库'],docTab,x=>{docTab=x;docRender()});let q=document.querySelector('#doc-search').value.toLowerCase();manualTable(docs.filter(r=>(docTab==='全部文档'||r[1]===docTab)&&r.join(' ').toLowerCase().includes(q)))}document.querySelector('#tool-search').oninput=toolsRender;document.querySelector('#env-search').oninput=envRender;document.querySelector('#doc-search').oninput=docRender;toolsRender();envRender();docRender();function memberRender(){let q=document.querySelector('#member-search').value.trim();let list=names.filter(x=>x.includes(q));document.querySelector('#count').textContent=list.length;document.querySelector('#members').replaceChildren(...list.map(n=>{let d=document.createElement('div');d.className='person';let a=document.createElement('div');a.className='avatar';a.textContent=n[0];let t=document.createElement('div');t.textContent=n;d.append(a,t);return d}))}document.querySelector('#member-search').oninput=memberRender;memberRender();let teamTab='团队成员';function teamRender(){tabs('#team-tabs',['团队成员','组织架构','跨部门协作'],teamTab,x=>{teamTab=x;teamRender()});document.querySelector('#people').hidden=teamTab!=='团队成员';document.querySelector('#org').hidden=teamTab!=='组织架构';document.querySelector('#collaboration').hidden=teamTab!=='跨部门协作'}teamRender();document.querySelector('#collab-list').innerHTML=['XDR','数据湖','STA','XDRA'].map(n=>`<div class="collab"><strong>${n}</strong><small>代码合并 / 问题修改 / 需求对接</small></div>`).join('');
