---
Title: GitHub Changelog npm Token Security Changes
Ticket: NPM-TRUST-001
Status: active
Topics:
    - npm
    - publishing
    - security
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources:
    - https://github.blog/changelog/2025-09-29-strengthening-npm-security-important-changes-to-authentication-and-token-management/
Summary: "Defuddle capture of GitHub Changelog npm Token Security Changes."
LastUpdated: 2026-06-01T15:12:00-04:00
WhatFor: "Source material for npm trusted publishing and token lockdown planning."
WhenToUse: "Use when designing or validating trusted publishing setup and package publishing access settings."
---

As part of our ongoing commitment to securing the npm ecosystem, we’re implementing the first phase of security improvements outlined in our [recent announcement](https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/).

These changes will roll out over the coming five weeks completing by mid-November 2025 and require action from package maintainers.

We’re taking this phased approach to balance security improvements with giving you time to adapt your workflows. Your patience and partnership in securing our shared ecosystem is deeply appreciated.

## What’s changing

### Granular npm access token lifetime limits

Starting in mid-October, all newly created write-enabled granular access tokens for npm will have:

- A default expiration of seven days, reduced from 30 days.
- A maximum expiration of 90 days, which used to be unlimited.

#### Why this matters

Long-lived tokens are a primary vector for supply chain attacks. When tokens are compromised, shorter lifetimes limit the window of exposure and reduce potential damage. This change brings npm in line with security best practices already adopted across the industry.

#### What you need to do

- Review your npm publishing CI/CD workflows that use granular tokens
- Plan for more frequent token rotation
- Consider migrating to [Trusted Publishers (OIDC)](https://docs.npmjs.com/trusted-publishers) for GitHub Actions workflows

Existing granular tokens will continue working with their current expiration dates, giving you time to transition.

### Classic npm token sunset

Over the next five weeks, we will:

- Revoke all existing legacy classic tokens for npm publishers.
- Disable legacy classic token generation on npmjs.com permanently.

#### Why this matters

Classic tokens lack granular permissions and modern security controls. They grant broad access to your account, making them high-risk if they are compromised.

#### What you need to do

If you use classic tokens for npm, you **must immediately** take the following actions:

- Generate new npm granular access tokens with appropriate scoped permissions.
- Update all automation, CI/CD pipelines, and local configurations.
- Check [npmjs.com documentation](https://docs.npmjs.com/) for updated guidance.

### TOTP 2FA configuration changes

New TOTP (Time-based One-Time Password) setups for npm access will be permanently disabled. Existing TOTP configurations will continue to work for now, but they will be phased out in the coming months.

#### Why this matters

We’re strengthening our 2FA implementation to prevent potential bypass vulnerabilities. WebAuthn/passkeys provide stronger, phishing-resistant authentication.

#### What you need to do

- If you already use TOTP, no immediate action is needed, but you should plan to migrate.
- New 2FA setups should use [WebAuthn/passkeys](https://docs.npmjs.com/configuring-two-factor-authentication).
- Consider upgrading existing TOTP to WebAuthn for enhanced security.

## Timeline and implementation

These changes will roll out progressively:

- **Now**: Warning messages appear in npm CLI and website.
- **Early October**: New token lifetime limits and TOTP changes take effect for npm publishers.
- **Mid-November**: Classic npm tokens revoked and generation disabled.

We’re deliberately spacing out these changes to give you time to adapt while maintaining momentum on security improvements.

## Looking ahead: Trusted publishers

While we’re tightening token security, we recognize that frequent rotation can be challenging for automation workflows. That’s why we strongly encourage adoption of [trusted publishing (OIDC)](https://docs.npmjs.com/trusted-publishers).

Trusted publishing eliminates long-lived tokens entirely by using temporary, job-specific credentials from your CI/CD provider. Currently supporting GitHub Actions and GitLab CI/CD, we’re actively working to expand support for Azure Pipelines, CircleCI, and other platforms.

The benefits of trusted publishing include:

- No tokens to rotate or leak
- Automatic provenance attestation
- Simplified security model
- Better audit trails

We know trusted publishing needs improvements to support all workflows, and we’re committed to expanding capabilities based on your feedback.

## We need your partnership

We understand these changes require effort from our community. Securing npm is a shared responsibility. These changes may cause temporary friction, but they’re essential for protecting our ecosystem from increasingly sophisticated attacks. The recent compromises of popular packages underscore the urgency of these improvements.

Things you can do to help:

- Start migrating away from classic npm tokens today
- Share feedback in our [Community Discussion thread](https://github.com/orgs/community/discussions/174507)
- Update your token rotation practices
- Help other maintainers in your community understand these changes

## Getting support

We’re here to help you through this transition:

- 📚 [npm Documentation](https://docs.npmjs.com/): Updated with the latest guidance
- 💬 [Community Discussion](https://github.com/orgs/community/discussions/174507): Share feedback and get help from the community
- 📧 [npm Support](https://www.npmjs.com/support): For additional assistance

## Thank you

Your commitment to security makes npm safer for millions of developers worldwide. Together, we’re building a more resilient foundation for the JavaScript ecosystem.

Stay tuned for future updates as we continue rolling out the security improvements outlined in our [security roadmap](https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/).

---

*This is the first in a series of security updates. Join the conversation in our [Community Discussion](https://github.com/orgs/community/discussions/174507).*

[

Back to top

](https://github.blog/changelog/2025-09-29-strengthening-npm-security-important-changes-to-authentication-and-token-management/#start-of-content)