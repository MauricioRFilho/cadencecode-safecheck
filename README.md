# CadenceCode SafeCheck

MVP público para verificação de segurança de URLs e imagens (prints), com score de segurança e explicações objetivas.

## Objetivo do MVP
- Analisar URLs por heurísticas (sem IA).
- Analisar imagens por OCR + regras heurísticas (sem IA).
- Retornar porcentagem de segurança com fatores de risco e recomendações.

## Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Deploy na Vercel

## Execução local
```bash
npm install
npm run dev
```

## Deploy
Deploy inicial publicado em:
- https://cadencecode-safecheck.vercel.app

## Status
- Fase atual: bootstrap standalone concluído.
- Próxima fase: implementação do motor de scoring URL/Imagem.
