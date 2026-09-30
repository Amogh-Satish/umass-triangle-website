import { initLayout, refreshAnimations, api } from './common.js';

await initLayout('address');
const page = await api('/api/pages/address');
document.getElementById('page-title').textContent = page.title;
document.getElementById('page-body').textContent = page.body;
document.getElementById('page-sig').textContent = page.signature;
refreshAnimations();
