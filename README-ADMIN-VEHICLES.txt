ADMIN "ADD VEHICLE" UPDATE  (Meridian Motors)
=============================================
1. Close the dev server (Ctrl+C).
2. Extract this zip INTO your project root (the folder that has package.json), choose "Replace" when asked.
3. DELETE this file by hand (a zip cannot delete): src/routes/showroom.tsx
4. Start again:  npm run dev      (it regenerates the route list automatically)
5. Sign in at /curator/login -> Inventory -> "Add vehicle".

No new npm packages are needed.
Cars and photos are saved in a new "data" folder in the project root (data/vehicles.json, data/uploads/).
Back that folder up. Add "data/" to .gitignore if you use git.
