const fs = require('fs');
let f = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');
f = f.replace(/SkillClub/g, 'FightClub');
f = f.replace(/skillclub\.ma/g, 'fightclub.ma');
f = f.replace(/Skill<span className="lp-grad-text">Club<\/span>/g, 'Fight<span className="lp-grad-text">Club</span>');
fs.writeFileSync('src/pages/LandingPage.tsx', f);
console.log('done');
