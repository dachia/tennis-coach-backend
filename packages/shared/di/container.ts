export class Container {
  private services: Map<string, any> = new Map();

  register(key: string, instance: any): void {
    this.services.set(key, instance);
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service ${key} not found in container`);
    }
    return service as T;
  }
}