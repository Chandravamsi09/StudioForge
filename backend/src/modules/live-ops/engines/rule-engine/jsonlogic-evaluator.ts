/**
 * StudioForge JSONLogic AST Rule Evaluator
 * Evaluates dynamic player segmentation rules (e.g. VIP level >= 3, guild membership, spend tier, churn risk)
 * to deliver tailored live-ops events, flash sales, and feature flag overrides.
 */

export interface RuleEvaluationContext {
  player: {
    id: string;
    level: number;
    vipTier: number;
    country: string;
    platform: string;
    totalSpendUsd: number;
    daysSinceLastLogin: number;
    guildId?: string;
    tags: string[];
    attributes: Record<string, any>;
  };
  environment: {
    serverRegion: string;
    clientVersion: string;
    currentTimeIso: string;
  };
}

export class JsonLogicRuleEvaluator {
  evaluate(rule: any, context: RuleEvaluationContext): boolean {
    if (typeof rule === 'boolean') return rule;
    if (!rule || typeof rule !== 'object') return false;

    const op = Object.keys(rule)[0];
    const args = rule[op];

    switch (op) {
      case 'and':
        return Array.isArray(args) ? args.every((sub) => this.evaluate(sub, context)) : false;
      case 'or':
        return Array.isArray(args) ? args.some((sub) => this.evaluate(sub, context)) : false;
      case '!':
        return !this.evaluate(args, context);
      case '==':
        return this.resolveValue(args[0], context) == this.resolveValue(args[1], context);
      case '===':
        return this.resolveValue(args[0], context) === this.resolveValue(args[1], context);
      case '!=':
        return this.resolveValue(args[0], context) != this.resolveValue(args[1], context);
      case '>':
        return Number(this.resolveValue(args[0], context)) > Number(this.resolveValue(args[1], context));
      case '>=':
        return Number(this.resolveValue(args[0], context)) >= Number(this.resolveValue(args[1], context));
      case '<':
        return Number(this.resolveValue(args[0], context)) < Number(this.resolveValue(args[1], context));
      case '<=':
        return Number(this.resolveValue(args[0], context)) <= Number(this.resolveValue(args[1], context));
      case 'in':
        const item = this.resolveValue(args[0], context);
        const list = this.resolveValue(args[1], context);
        return Array.isArray(list) ? list.includes(item) : typeof list === 'string' ? list.includes(String(item)) : false;
      case 'has_tag':
        const targetTag = this.resolveValue(args[0], context);
        return context.player.tags.includes(String(targetTag));
      case 'is_in_guild':
        return !!context.player.guildId;
      case 'semver_gte':
        return this.compareSemver(String(this.resolveValue(args[0], context)), String(this.resolveValue(args[1], context))) >= 0;
      default:
        return false;
    }
  }

  private resolveValue(arg: any, context: RuleEvaluationContext): any {
    if (arg && typeof arg === 'object' && 'var' in arg) {
      const path = String(arg.var).split('.');
      let curr: any = context;
      for (let i = 0; i < path.length; i++) {
        if (curr === undefined || curr === null) return undefined;
        curr = curr[path[i]];
      }
      return curr;
    }
    return arg;
  }

  private compareSemver(v1: string, v2: string): number {
    const p1 = v1.replace(/^v/, '').split('.').map(Number);
    const p2 = v2.replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  }
}
