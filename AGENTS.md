<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:language-rules -->
## Idioma

Responda SEMPRE em **português do Brasil (pt-BR)**, em todas as mensagens, explicações e comentários. Seja direto, objetivo e use terminologia técnica quando apropriado.
<!-- END:language-rules -->

<!-- BEGIN:filesystem-safety-rules -->
## Segurança do Sistema de Arquivos

1. **Acesso proibido:** NUNCA acesse, leia, escreva ou liste arquivos em `C:\*` / `C:` e NUNCA acesse arquivos `.env` (incluindo `.env.*`, `.env.local`, etc.) em qualquer diretório.
2. **Arquivos temporários:** Use SEMPRE `D:\temp` para criar, escrever ou manipular arquivos temporários. Não use `C:\*`, `/tmp` ou outros diretórios temporários do sistema.
<!-- END:filesystem-safety-rules -->
