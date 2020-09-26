import { existsSync, promises } from 'fs';
import { dirname, join } from 'path';
import { createLogger } from '../utilities/Console';
import { IConfig } from './IConfig';

const { mkdir, readFile, writeFile } = promises;
const { log, error } = createLogger('Config');

export class Config extends IConfig {
  isLoaded = false;

  private file: string;

  constructor(file: string) {
    super();
    this.file = file;
  }

  async load() {
    const { file } = this;
    await mkdir(dirname(file), { recursive: true });
    this.isLoaded = false;
    let config: IConfig = {};
    try {
      config = JSON.parse(await readFile(file, 'utf8'));
    } catch (err) {
      if (!existsSync(file)) writeFile(file, '{}', 'utf8');
      else error('Config file could not be used, returning to default values...');
    }
    Object.assign(this, {
      debug: config.debug ?? false,
      theme: config.theme ?? 'dark',
      locale: config.locale ?? 'en-US',
    } as IConfig);
    if (config.debug === true) log('Loaded config:', this);
    this.isLoaded = true;
  }

  async save() {
    try {
      const obj = { ...this };
      // @ts-ignore
      delete obj.file;
      // @ts-ignore
      delete obj.isLoaded;

      await writeFile(join(this.file), JSON.stringify(obj));
    } catch (e) {
      error(e);
    }
  }
}
