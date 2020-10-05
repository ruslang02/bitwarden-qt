import { CryptoService } from 'jslib/abstractions/crypto.service';
import { StorageService } from 'jslib/abstractions/storage.service';
import { SymmetricCryptoKey } from 'jslib/models/domain';
import { ErrorResponse } from 'jslib/models/response';

import { Utils } from 'jslib/misc/utils';

export class NodeEnvSecureStorageService implements StorageService {
    constructor(private storageService: StorageService, private cryptoService: () => CryptoService) { }

    async get<T>(key: string): Promise<T> {
        const value = await this.storageService.get<string>(this.makeProtectedStorageKey(key));
        if (value == null) {
            return null;
        }
        const obj = await this.decrypt(value);
        return obj as any;
    }

    async save(key: string, obj: any): Promise<any> {
        if (typeof (obj) !== 'string') {
            throw new Error('Only string storage is allowed.');
        }
        const protectedObj = await this.encrypt(obj);
        await this.storageService.save(this.makeProtectedStorageKey(key), protectedObj);
    }

    remove(key: string): Promise<any> {
        return this.storageService.remove(this.makeProtectedStorageKey(key));
    }

    private async encrypt(plainValue: string): Promise<string> {
        const sessionKey = this.getSessionKey();
        if (sessionKey == null) {
            throw new Error('No session key available.');
        }
        const encValue = await this.cryptoService().encryptToBytes(
            Utils.fromB64ToArray(plainValue).buffer, sessionKey);
        if (encValue == null) {
            throw new Error('Value didn\'t encrypt.');
        }

        return Utils.fromBufferToB64(encValue);
    }

    private async decrypt(encValue: string): Promise<string> {
        try {
            const sessionKey = this.getSessionKey();
            if (sessionKey == null) {
                return null;
            }

            const decValue = await this.cryptoService().decryptFromBytes(
                Utils.fromB64ToArray(encValue).buffer, sessionKey);
            if (decValue == null) {
                // tslint:disable-next-line
                console.log('Failed to decrypt.');
                return null;
            }

            return Utils.fromBufferToB64(decValue);
        } catch (e) {
            // tslint:disable-next-line
            console.log('Decrypt error.');
            return null;
        }
    }

    private getSessionKey() {
        try {
            if (process.env.BW_SESSION != null) {
                const sessionBuffer = Utils.fromB64ToArray(process.env.BW_SESSION).buffer;
                if (sessionBuffer != null) {
                    const sessionKey = new SymmetricCryptoKey(sessionBuffer);
                    if (sessionBuffer != null) {
                        return sessionKey;
                    }
                }
            }
        } catch (e) {
            // tslint:disable-next-line
            console.log('Session key is invalid.');
        }

        return null;
    }

    private makeProtectedStorageKey(key: string) {
        return '__PROTECTED__' + key;
    }
}
