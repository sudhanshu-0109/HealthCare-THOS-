/**
 * utils/hash.js — Password hashing utilities using bcryptjs.
 * 12 salt rounds — strong enough for production healthcare data.
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password.
 * @param {string} plain
 * @returns {Promise<string>} hashed password
 */
export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

/**
 * Compare a plain-text password against a stored hash.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);
