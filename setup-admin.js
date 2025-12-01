const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

async function setupAdmin() {
    const password = 'admin123'; // Default admin password
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = {
        id: 'admin1',
        username: 'admin',
        passwordHash: passwordHash
    };

    const adminsFile = path.join(__dirname, 'data', 'admins.json');
    await fs.writeFile(adminsFile, JSON.stringify([admin], null, 2));

    console.log('Admin account created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
}

setupAdmin().catch(console.error);

