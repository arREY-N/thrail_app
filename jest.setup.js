// jest.setup.js
require('dotenv').config();
global.__DEV__ = true; // ensure the emulator-connect branch always runs under Jest