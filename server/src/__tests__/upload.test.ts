import test from 'node:test';import assert from 'node:assert/strict';import { validateUpload } from '../uploadRepo.js';
const b=Buffer.from('hello');
test('upload validation accepts allowed payload',()=>assert.equal(validateUpload('a.txt','text/plain',b.length,b.toString('base64')),null));
test('upload validation rejects executable mime',()=>assert.equal(validateUpload('a.exe','application/x-msdownload',b.length,b.toString('base64')),'type_not_allowed'));
test('upload validation rejects size mismatch',()=>assert.equal(validateUpload('a.txt','text/plain',99,b.toString('base64')),'size_mismatch'));
test('upload validation rejects oversized metadata',()=>assert.equal(validateUpload('a.txt','text/plain',200*1024+1,b.toString('base64')),'size_invalid'));
