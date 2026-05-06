# Branding (White Label)

ארכיטקטורת White Label: קוד בסיס אחד (mobile + web), מספר אפליקציות ממותגות.

כל לקוח יושב בתוך תיקייה תחת `branding/<Client>/` עם המבנה הבא:

```
branding/<Client>/
├─ .env                # סודות ומזהה עסק (לא נכנס ל-git)
├─ .env.example        # תבנית פומבית
├─ app.config.json     # הגדרות Expo (mobile): name, slug, scheme, bundleIdentifier, package, icon, splash
├─ web.config.json     # הגדרות Next.js (web): title, description, manifestThemeColor, lang, dir
├─ theme.json          # colors, fonts, branding (companyName, website, supportEmail)
├─ icon.png            # אייקון אפליקציה (mobile)
├─ splash.png          # מסך פתיחה (mobile)
├─ adaptive-icon.png   # אייקון אנדרואיד (mobile)
├─ favicon.png         # פאביקון (web)
├─ logo.png            # לוגו רגיל (כהה על בהיר)
└─ logo-white.png      # לוגו הפוך (בהיר על כהה) — אופציונלי
```

קבצים נוספים ב-monorepo:
- `branding/current.json` — נכתב אוטומטית, מכיל את שם הלקוח הפעיל. **לא לערוך ידנית**.

## הוספת לקוח חדש

```bash
node scripts/add-client.mjs <ClientName>
```

או ידנית:
1. צור `branding/<ClientName>/` עם הקבצים שלמעלה (אפשר להעתיק מ-`Default/`).
2. עדכן את `.env` עם `BUSINESS_ID` (UUID), `EXPO_PUBLIC_*`, `NEXT_PUBLIC_*`.
3. הוסף שורה ב-`apps/mobile/src/theme/assets.ts` (`clientLogos`, `clientSplashes`, `clientIcons`).
4. הוסף סקריפטים ב-`package.json` ברמת root: `start:<ClientName>`, `start:web:<ClientName>`, `build:<ClientName>:ios|android|all`.
5. הוסף ל-`apps/mobile/eas.json` פרופיל בשם `<ClientName>` (CLIENT, ENV_FILE, EAS_PROJECT_ID).
6. צור רשומה ב-`tenants` ב-Supabase עם `id = BUSINESS_ID`.

## בחירת לקוח מקומית

```bash
node scripts/switch-client.mjs <ClientName>
```

זה מסנכרן את `branding/<ClientName>/` אל `apps/web/public/branding/current/` עבור web,
ומעדכן את `branding/current.json` כך ש-Expo יקרא אותו.

## כללי ברזל
- אין הקשחת `BUSINESS_ID` או שם לקוח בקוד עסקי. השתמש ב-`getBusinessId()`.
- אין יצירת instance נוסף של supabase — השתמש ב-`supabase` המיוצא.
- כל שאילתת DB חייבת `.eq('tenant_id', getBusinessId())` (פרט ל-`tenants` שמסונן ב-`id`).
- מפתחות סודיים אך ורק ב-`branding/<Client>/.env` (לא נכנס ל-git).
- `branding/current.json` ו-`apps/mobile/src/config/currentClient.ts` נוצרים אוטומטית.
