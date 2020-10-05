/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import envPaths from 'env-paths';
import { ApiService as ApiServiceAbstracion } from 'jslib/abstractions/api.service';
import { CryptoFunctionService as CryptoFunctionServiceAbstraction } from 'jslib/abstractions/cryptoFunction.service';
import { PolicyService as PolicyServiceAbstraction } from 'jslib/abstractions/policy.service';
import { StorageService as StorageServiceAbstraction } from 'jslib/abstractions/storage.service';
import { SyncService as SyncServiceAbstraction } from 'jslib/abstractions/sync.service';
import { ConsoleLogService } from 'jslib/cli/services/consoleLog.service';
// import { Analytics } from 'jslib/misc/analytics';
import {
    ApiService,
    AppIdService,
    AuditService,
    AuthService,
    CipherService,
    CollectionService,
    ConstantsService,
    ContainerService,
    CryptoService,
    EnvironmentService,
    FolderService,
    I18nService,
    PasswordGenerationService,
    SettingsService,
    StateService,
    SyncService,
    TokenService,
    TotpService,
    UserService,
    VaultTimeoutService
} from 'jslib/services';
import { EventService } from 'jslib/services/event.service';
import { ExportService } from 'jslib/services/export.service';
import { LowdbStorageService } from 'jslib/services/lowdbStorage.service';
import { NodeCryptoFunctionService } from 'jslib/services/nodeCryptoFunction.service';
import { NoopMessagingService } from 'jslib/services/noopMessaging.service';
import { NotificationsService } from 'jslib/services/notifications.service';
import { PolicyService } from 'jslib/services/policy.service';
import { SearchService } from 'jslib/services/search.service';
import { SystemService } from 'jslib/services/system.service';
import { NodeEnvSecureStorageService } from './nodeEnvSecureStorage.service';
import { QPlatformUtilsService } from './qPlatformUtils.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const packageJson = require('../../package.json') as { version: string };

export const paths = envPaths('bitwarden', { suffix: 'qt' });
export const logService = new ConsoleLogService(true);
export const i18nService = new I18nService('en', './locales', () => { });
export const stateService = new StateService();
// const broadcasterService = new BroadcasterService();
export const messagingService = new NoopMessagingService();
export const storageService: StorageServiceAbstraction = new LowdbStorageService(null, paths.config, true);
export const platformUtilsService = new QPlatformUtilsService('qt', packageJson);
export const secureStorageService: StorageServiceAbstraction = new NodeEnvSecureStorageService(storageService, () => cryptoService);
export const cryptoFunctionService: CryptoFunctionServiceAbstraction = new NodeCryptoFunctionService();
export const cryptoService = new CryptoService(storageService, secureStorageService, cryptoFunctionService);
export const tokenService = new TokenService(storageService);
export const appIdService = new AppIdService(storageService);
export const apiService: ApiServiceAbstracion = new ApiService(tokenService, platformUtilsService,
    (expired: boolean) => Promise.resolve(messagingService.send('logout', { expired: expired })));
export const userService = new UserService(tokenService, storageService);
export const settingsService = new SettingsService(userService, storageService);
export let searchService: SearchService = null;
export const cipherService = new CipherService(cryptoService, userService, settingsService,
    apiService, storageService, i18nService, () => searchService);
export const folderService = new FolderService(cryptoService, userService, apiService, storageService,
    i18nService, cipherService);
export const collectionService = new CollectionService(cryptoService, userService, storageService, i18nService);
searchService = new SearchService(cipherService);
export const policyService: PolicyServiceAbstraction = new PolicyService(userService, storageService);
export const vaultTimeoutService = new VaultTimeoutService(cipherService, folderService, collectionService,
    cryptoService, platformUtilsService, storageService, messagingService, searchService, userService, tokenService,
    undefined, () => Promise.resolve(messagingService.send('logout', { expired: false })));
export const syncService: SyncServiceAbstraction = new SyncService(userService, apiService, settingsService,
    folderService, cipherService, cryptoService, collectionService, storageService, messagingService, policyService,
    (expired: boolean) => Promise.resolve(messagingService.send('logout', { expired: expired })));
export const passwordGenerationService = new PasswordGenerationService(cryptoService, storageService, policyService);
export const totpService = new TotpService(storageService, cryptoFunctionService);
export const containerService = new ContainerService(cryptoService);
export const authService = new AuthService(cryptoService, apiService, userService, tokenService, appIdService,
    i18nService, platformUtilsService, messagingService, vaultTimeoutService);
export const exportService = new ExportService(folderService, cipherService, apiService);
export const auditService = new AuditService(cryptoFunctionService, apiService);
export const notificationsService = new NotificationsService(userService, syncService, appIdService,
    apiService, vaultTimeoutService, () => Promise.resolve(messagingService.send('logout', { expired: true })));
export const environmentService = new EnvironmentService(apiService, storageService, notificationsService);
export const eventService = new EventService(storageService, apiService, userService, cipherService);
export const systemService = new SystemService(storageService, vaultTimeoutService, messagingService, platformUtilsService);
/*
export const analytics = new Analytics(window, () => true, platformUtilsService, storageService, appIdService);
containerService.attachToGlobal(window);
*/
export function initFactory() {
    return async (): Promise<void> => {
        await environmentService.setUrlsFromStorage();
        void syncService.fullSync(true);
        vaultTimeoutService.init(true);
        const locale = await storageService.get<string>(ConstantsService.localeKey);
        await i18nService.init(locale);
        eventService.init(true);
        authService.init();
        setTimeout(() => void notificationsService.init(environmentService), 3000);
        // const htmlEl = window.document.documentElement;
        // htmlEl.classList.add('os_' + platformUtilsService.getDeviceString());
        // htmlEl.classList.add('locale_' + i18nService.translationLocale);
        let theme = await storageService.get<string>(ConstantsService.themeKey);
        if (theme == null) {
            // theme = platformUtilsService.getDevice() === DeviceType.MacOsDesktop &&
            //    remote.systemPreferences.isDarkMode() ? 'dark' : 'light';
            theme = 'light';
        }
        // htmlEl.classList.add('theme_' + theme);
        void stateService.save(ConstantsService.disableFaviconKey,
            await storageService.get<boolean>(ConstantsService.disableFaviconKey));

        let installAction = null;
        const installedVersion = await storageService.get<string>(ConstantsService.installedVersionKey);
        const currentVersion = platformUtilsService.getApplicationVersion();
        if (installedVersion == null) {
            installAction = 'install';
        } else if (installedVersion !== currentVersion) {
            installAction = 'update';
        }

        if (installAction != null) {
            await storageService.save(ConstantsService.installedVersionKey, currentVersion);
            void analytics.ga('send', {
                hitType: 'event',
                eventAction: installAction,
            });
        }
    };
}
