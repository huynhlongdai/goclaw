# Deploy Checklist — AgentClaw

> AI phải đọc file này trước mỗi lần commit/push/deploy.

## 1. GitHub — Push CẢ 2 repo (branch: `dev`)

| Remote | URL |
|--------|-----|
| `origin` | https://github.com/huynhlongdai/agentClaw |
| `goclaw` | https://github.com/huynhlongdai/goclaw |

```bash
git push && git push goclaw dev
```

---

## 2. Coolify

| Item | Value |
|------|-------|
| Dashboard | http://152.42.161.112:8000 |
| API Token | `19|DdrF2tSUbAzDX9R16eFMJmK86Zt3T3s7SlamoFTT3ab5ab08` |
| Project URL | http://152.42.161.112:8000/project/u1pfi12x55mjrrmc1ekigp1p/environment/z4hgf8wyo1zqaoc3kyx1c9pn/application/c7aozuijay5iy3mumhr8djuw |
| Live domain | https://agent.vnsi.app |

---

## 3. ⚠️ UI thay đổi — PHẢI rebuild dist trước khi push

`ui/web/dist/` được commit vào repo. Dockerfile kiểm tra folder này trước — nếu tồn tại sẽ **skip** `pnpm build` → UI cũ sẽ được dùng.

### Quy trình đúng khi có thay đổi UI:

```bash
# 1. Build frontend
cd ui/web && npm run build

# 2. Commit source + dist cùng nhau
cd ../..
git add -A
git commit -m "feat/fix: <mô tả> + rebuild dist"

# 3. Push cả 2 repo
git push && git push goclaw dev
```

Sau khi push, Coolify sẽ tự webhook trigger hoặc vào dashboard → **Redeploy**.
