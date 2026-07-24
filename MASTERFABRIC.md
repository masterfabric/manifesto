# MasterFabric integration

## Auth vs Particular

| Concern | Owner |
|---------|--------|
| Register / login / GitHub OAuth / `me` | **mf-go only** |
| Public manifesto body + signature wall | **particular-manifesto** (via mf-go envelope) |

```
Browser
  ├─ Sign in with GitHub  →  mf-go loginWithGitHub  →  session (access token)
  ├─ manifesto body       ←── mf-go ←── particular-manifesto (SQLite document)
  └─ sign / list          ←── BFF uses mf-go `me` for profile, then
                               mf-go particularGraphqlEnvelope → particular-manifesto
```

Particular **does not** register users. Its hop JWT only carries `user_id` + capabilities from mf-go.  
On sign, the Next BFF loads profile from mf-go `me` (`displayName`, `socialGitHub`, `avatarURL`) and stores a **public snapshot** on the signature row (same shape as the old Supabase `profiles` join) so the wall can render without calling mf-go per card.

## Where things live

| What | Where |
|------|--------|
| **Auth** | mf-go (`loginWithGitHub`, `me`) |
| **Manifesto text** | Particular DB (`body_markdown`, seeded from `content/manifesto.md`) |
| **Signatures** | Particular DB (denormalized public profile + message/location) |
