import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SubscriptionInfo, PlanTier, UserRole } from '../types';
import { CreditCard, Check, Sparkles, UserPlus, AlertCircle, ShieldAlert, ArrowUpRight } from 'lucide-react';

export const BillingPage: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('DEVELOPER');
  const [invitePassword, setInvitePassword] = useState('Welcome2026!');
  const [errorMessage, setErrorMessage] = useState('');

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const res = await api.getSubscription();
      setSubscription(res);
    } catch (err) {
      console.error('Failed to load subscription', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const handleUpgrade = async (plan: PlanTier) => {
    try {
      await api.upgradePlan(plan);
      loadSubscription();
    } catch (err: any) {
      alert(err.message || 'Failed to upgrade plan');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await api.inviteMember({
        email: inviteEmail,
        firstName: inviteFirstName,
        lastName: inviteLastName,
        role: inviteRole,
        temporaryPassword: invitePassword,
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      loadSubscription();
      alert('Team member successfully invited!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to invite member');
    }
  };

  const plans = [
    {
      id: 'FREE' as PlanTier,
      name: 'Free Studio',
      price: '$0',
      period: 'forever',
      seats: 'Up to 5 Seats',
      features: ['5 Team Seats', 'Build Pipelines Tracking', 'Basic QA Ticketing', 'Player Analytics (10k events/mo)'],
    },
    {
      id: 'PRO' as PlanTier,
      name: 'Pro Studio',
      price: '$99',
      period: 'per month',
      seats: 'Up to 25 Seats',
      popular: true,
      features: ['25 Team Seats', 'Live-Ops Feature Flags', 'Advanced Bug Workflow', '500k Telemetry Events/mo', 'Priority Support'],
    },
    {
      id: 'ENTERPRISE' as PlanTier,
      name: 'Enterprise Studio',
      price: '$499',
      period: 'per month',
      seats: 'Up to 1,000 Seats',
      features: ['Unlimited Seats (1000 included)', 'Full Live-Ops Console', 'Dedicated Support & SLA', 'Custom Telemetry Streaming', 'Multi-Region Ingestion'],
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            <span>Billing, Subscriptions & Seats</span>
          </h1>
          <p className="text-sm text-slate-400">
            Manage organization tier, active seats metering, and seat limit enforcement.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage('');
            setShowInviteModal(true);
          }}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/25"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Seat Metering Progress Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">Active Seat Utilization</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {subscription?.planTier || 'FREE'} Tier
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforced multi-tenant seat limit protection on studio team invitations.
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-extrabold text-white">
              {subscription?.seats?.usedSeats ?? 1}{' '}
              <span className="text-sm font-semibold text-slate-400">
                / {subscription?.seats?.maxSeats ?? 5} Seats Used
              </span>
            </div>
            <div className="text-xs text-emerald-400 font-semibold">
              {subscription?.seats?.availableSeats ?? 4} available seats
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              (subscription?.seats?.usedSeats || 1) >= (subscription?.seats?.maxSeats || 5)
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
            }`}
            style={{
              width: `${Math.min(
                100,
                Math.round(
                  ((subscription?.seats?.usedSeats || 1) /
                    (subscription?.seats?.maxSeats || 5)) *
                    100,
                ),
              )}%`,
            }}
          />
        </div>

        {subscription?.seats?.isSeatLimitReached && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-3 text-xs text-rose-300">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>
              <strong>Seat limit reached.</strong> You must upgrade your subscription tier to invite additional developers or QA engineers.
            </span>
          </div>
        )}
      </div>

      {/* Plan Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = subscription?.planTier === p.id;
          return (
            <div
              key={p.id}
              className={`rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 ${
                isCurrent
                  ? 'bg-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/10 relative'
                  : 'bg-slate-900/50 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {p.popular && !isCurrent && (
                <div className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white px-3 py-1 rounded-full w-fit mb-3">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950 px-3 py-1 rounded-full w-fit mb-3">
                  Current Plan
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                <div className="mt-3 flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold text-white tracking-tight">{p.price}</span>
                  <span className="text-xs text-slate-400 font-medium">/{p.period}</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-indigo-400">{p.seats}</div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold cursor-default"
                  >
                    Active Tier
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(p.id)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-1.5"
                  >
                    <span>Upgrade to {p.name}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Invite Member */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Invite Studio Team Member</h2>
            <p className="text-xs text-slate-400">
              New users are granted access to your studio's isolated operational workspace.
            </p>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="developer@studio.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">First Name</label>
                  <input
                    type="text"
                    required
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Last Name</label>
                  <input
                    type="text"
                    required
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">RBAC Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200"
                >
                  <option value="DEVELOPER">Developer (Full pipeline access)</option>
                  <option value="QA_ENGINEER">QA Engineer (Bug tracking & verification)</option>
                  <option value="ADMIN">Admin (Organization administration)</option>
                  <option value="VIEWER">Viewer (Read-only access)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Temporary Password</label>
                <input
                  type="text"
                  required
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/25"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
