/**
 * SPDX-FileCopyrightText: (c) 2024 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, mergeTests} from '@playwright/test';

import {accountsPagesTest} from '../../fixtures/accountsPagesTest';
import {applicationsMenuPageTest} from '../../fixtures/applicationsMenuPageTest';
import {dataApiHelpersTest} from '../../fixtures/dataApiHelpersTest';
import {featureFlagsTest} from '../../fixtures/featureFlagsTest';
import {isolatedSiteTest} from '../../fixtures/isolatedSiteTest';
import {loginTest} from '../../fixtures/loginTest';
import {usersAndOrganizationsPagesTest} from '../../fixtures/usersAndOrganizationsPagesTest';
import {DataApiHelpers} from '../../helpers/ApiHelpers';
import {TRole} from '../../helpers/HeadlessAdminUserApiHelper';
import {AccountOrganizationSelectorPage} from '../../pages/account-admin-web/AccountOrganizationSelectorPage';
import {AccountsPage} from '../../pages/account-admin-web/AccountsPage';
import {getRandomInt} from '../../utils/getRandomInt';
import getRandomString from '../../utils/getRandomString';
import {nextPage, setItemsPerPage} from '../../utils/pagination';
import performLogin, {
	performLoginViaApi,
	performLogout,
	userData,
} from '../../utils/performLogin';
import {waitForAlert} from '../../utils/waitForAlert';
import getPageDefinition from '../layout-content-page-editor-web/utils/getPageDefinition';
import getWidgetDefinition from '../layout-content-page-editor-web/utils/getWidgetDefinition';

export const test = mergeTests(
	accountsPagesTest,
	applicationsMenuPageTest,
	dataApiHelpersTest,
	isolatedSiteTest,
	featureFlagsTest({
		'LPS-178052': {enabled: true},
	}),
	loginTest(),
	usersAndOrganizationsPagesTest
);

const initAccountAdmin = async (apiHelpers: DataApiHelpers) => {
	const account = await apiHelpers.headlessAdminUser.postAccount({
		type: 'business',
	});

	apiHelpers.data.push({id: account.id, type: 'account'});

	const userAccountManager =
		await apiHelpers.headlessAdminUser.postUserAccount();

	userData[userAccountManager.alternateName] = {
		name: userAccountManager.givenName,
		password: 'test',
		surname: userAccountManager.familyName,
	};

	await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
		account.id,
		[userAccountManager.emailAddress]
	);

	const role = await (
		await apiHelpers.headlessAdminUser.getAccountRoles(account.id)
	).items.find((item: TRole) => item.name === 'Account Administrator');

	await apiHelpers.headlessAdminUser.assignUserToAccountRole(
		account.id,
		role.id,
		userAccountManager.id
	);

	return {account, userAccountManager};
};

async function postRoleWithAccountAdminPermissions(
	apiHelpers: any,
	companyId: string
) {
	return await apiHelpers.headlessAdminUser.postRole({
		name: getRandomString(),
		rolePermissions: [
			{
				actionIds: [
					'ASSIGN_USERS',
					'MANAGE_ADDRESSES',
					'MANAGE_CHANNEL_DEFAULTS',
					'MANAGE_ORGANIZATIONS',
					'MANAGE_USERS',
					'UPDATE',
					'VIEW',
					'VIEW_ACCOUNT_ROLES',
					'VIEW_ADDRESSES',
					'VIEW_CHANNEL_DEFAULTS',
					'VIEW_ORGANIZATIONS',
					'VIEW_USERS',
				],
				primaryKey: '0',
				resourceName: 'com.liferay.account.model.AccountEntry',
				scope: 3,
			},
			{
				actionIds: ['VIEW'],
				primaryKey: '0',
				resourceName: 'com.liferay.account.model.AccountRole',
				scope: 3,
			},
			{
				actionIds: ['VIEW'],
				primaryKey: companyId,
				resourceName: 'com.liferay.commerce.model.CommerceOrderType',
				scope: 1,
			},
			{
				actionIds: [
					'ADD_COMMERCE_ORDER',
					'APPROVE_OPEN_COMMERCE_ORDERS',
					'CHECKOUT_OPEN_COMMERCE_ORDERS',
					'DELETE_COMMERCE_ORDERS',
					'MANAGE_COMMERCE_ORDERS',
					'MANAGE_COMMERCE_ORDER_DELIVERY_TERMS',
					'MANAGE_COMMERCE_ORDER_PAYMENT_METHODS',
					'MANAGE_COMMERCE_ORDER_PAYMENT_STATUSES',
					'MANAGE_COMMERCE_ORDER_PAYMENT_TERMS',
					'MANAGE_COMMERCE_ORDER_SHIPPING_OPTIONS',
					'VIEW_BILLING_ADDRESS',
					'VIEW_COMMERCE_ORDERS',
					'VIEW_OPEN_COMMERCE_ORDERS',
				],
				primaryKey: '0',
				resourceName: 'com.liferay.commerce.order',
				scope: 3,
			},
		],
		roleType: 'account',
	});
}

test.describe('Test for Organization Account visibility depending on Permissions', () => {
	test('LPD-28116 Update Organizations permission visibility', async ({
		accountOrganizationSelectorPage,
		accountsPage,
		apiHelpers,
		context,
		page,
		usersAndOrganizationsPage,
	}) => {
		const organization1 =
			await apiHelpers.headlessAdminUser.postOrganization();
		const organization2 =
			await apiHelpers.headlessAdminUser.postOrganization();

		const user = await apiHelpers.headlessAdminUser.postUserAccount();

		await apiHelpers.headlessAdminUser.assignUserToOrganizationByEmailAddress(
			organization1.id,
			user.emailAddress
		);

		const companyId = await page.evaluate(() => {
			return Liferay.ThemeDisplay.getCompanyId();
		});

		const role = await apiHelpers.headlessAdminUser.postRole({
			name: getRandomString(),
			rolePermissions: [
				{
					actionIds: [
						'MANAGE_USERS',
						'UPDATE',
						'UPDATE_ORGANIZATIONS',
						'VIEW',
						'VIEW_ORGANIZATIONS',
					],
					primaryKey: companyId,
					resourceName: 'com.liferay.account.model.AccountEntry',
					scope: 1,
				},
				{
					actionIds: ['MANAGE_AVAILABLE_ACCOUNTS'],
					primaryKey: companyId,
					resourceName:
						'com.liferay.portal.kernel.model.Organization',
					scope: 1,
				},
				{
					actionIds: ['ACCESS_IN_CONTROL_PANEL'],
					primaryKey: companyId,
					resourceName:
						'com_liferay_account_admin_web_internal_portlet_AccountEntriesAdminPortlet',
					scope: 1,
				},
			],
			roleType: 'organization',
		});

		await apiHelpers.headlessAdminUser.assignUserToOrganizationRole(
			role.id,
			user.id,
			organization1.id
		);

		const account = await apiHelpers.headlessAdminUser.postAccount();
		apiHelpers.data.push({id: account.id, type: 'account'});

		await apiHelpers.headlessAdminUser.postAccountOrganization(
			account.id,
			organization1.id
		);

		await usersAndOrganizationsPage.goToUsers();

		await (
			await usersAndOrganizationsPage.usersTableRowActions(
				`${user.alternateName}`
			)
		).click();

		const pagePromise = context.waitForEvent('page');

		await usersAndOrganizationsPage.impersonateUserMenuItem.click();

		const newPage = await pagePromise;
		accountsPage = new AccountsPage(newPage);

		await accountsPage.goto();
		await (await accountsPage.accountsTable.cellLink(account.name)).click();
		await accountsPage.organizationsTab.click();
		await accountsPage.accountsTable.newButton.click();

		await expect(
			accountOrganizationSelectorPage.frame.getByText(
				organization2.name,
				{exact: true}
			)
		).toHaveCount(0);
	});

	test('LPD-28116 Manage Organizations Permission visibility', async ({
		accountOrganizationSelectorPage,
		accountsPage,
		apiHelpers,
		context,
		page,
		usersAndOrganizationsPage,
	}) => {
		test.setTimeout(120000);

		const organization1 =
			await apiHelpers.headlessAdminUser.postOrganization();
		const organization2 =
			await apiHelpers.headlessAdminUser.postOrganization();

		const user = await apiHelpers.headlessAdminUser.postUserAccount();

		await apiHelpers.headlessAdminUser.assignUserToOrganizationByEmailAddress(
			organization1.id,
			user.emailAddress
		);

		const companyId = await page.evaluate(() => {
			return Liferay.ThemeDisplay.getCompanyId();
		});

		const role = await apiHelpers.headlessAdminUser.postRole({
			name: getRandomString(),
			rolePermissions: [
				{
					actionIds: [
						'MANAGE_ORGANIZATIONS',
						'MANAGE_USERS',
						'UPDATE',
						'VIEW',
						'VIEW_ORGANIZATIONS',
					],
					primaryKey: companyId,
					resourceName: 'com.liferay.account.model.AccountEntry',
					scope: 1,
				},
				{
					actionIds: ['MANAGE_AVAILABLE_ACCOUNTS'],
					primaryKey: companyId,
					resourceName:
						'com.liferay.portal.kernel.model.Organization',
					scope: 1,
				},
				{
					actionIds: ['ACCESS_IN_CONTROL_PANEL'],
					primaryKey: companyId,
					resourceName:
						'com_liferay_account_admin_web_internal_portlet_AccountEntriesAdminPortlet',
					scope: 1,
				},
			],
			roleType: 'organization',
		});

		await apiHelpers.headlessAdminUser.assignUserToOrganizationRole(
			role.id,
			user.id,
			organization1.id
		);

		const account = await apiHelpers.headlessAdminUser.postAccount();
		apiHelpers.data.push({id: account.id, type: 'account'});

		await apiHelpers.headlessAdminUser.postAccountOrganization(
			account.id,
			organization1.id
		);

		await usersAndOrganizationsPage.goToUsers();

		await (
			await usersAndOrganizationsPage.usersTableRowActions(
				`${user.alternateName}`
			)
		).click();

		const pagePromise = context.waitForEvent('page');

		await usersAndOrganizationsPage.impersonateUserMenuItem.click();

		const newPage = await pagePromise;
		accountsPage = new AccountsPage(newPage);
		accountOrganizationSelectorPage = new AccountOrganizationSelectorPage(
			newPage
		);

		await accountsPage.goto();
		await (await accountsPage.accountsTable.cellLink(account.name)).click();
		await accountsPage.organizationsTab.click();
		await accountsPage.accountsTable.newButton.click();

		await expect(
			accountOrganizationSelectorPage.organizationsTable.cell(
				organization1.name
			)
		).toBeVisible();
		await expect(
			accountOrganizationSelectorPage.organizationsTable.cell(
				organization2.name
			)
		).toBeVisible();
	});

	test('LPD-28116 No Update or Manage Organizations permission', async ({
		accountsPage,
		apiHelpers,
		context,
		page,
		usersAndOrganizationsPage,
	}) => {
		const organization1 =
			await apiHelpers.headlessAdminUser.postOrganization();

		const user = await apiHelpers.headlessAdminUser.postUserAccount();

		await apiHelpers.headlessAdminUser.assignUserToOrganizationByEmailAddress(
			organization1.id,
			user.emailAddress
		);

		const companyId = await page.evaluate(() => {
			return Liferay.ThemeDisplay.getCompanyId();
		});

		const role = await apiHelpers.headlessAdminUser.postRole({
			name: getRandomString(),
			rolePermissions: [
				{
					actionIds: [
						'MANAGE_USERS',
						'UPDATE',
						'VIEW',
						'VIEW_ORGANIZATIONS',
					],
					primaryKey: companyId,
					resourceName: 'com.liferay.account.model.AccountEntry',
					scope: 1,
				},
				{
					actionIds: ['MANAGE_AVAILABLE_ACCOUNTS'],
					primaryKey: companyId,
					resourceName:
						'com.liferay.portal.kernel.model.Organization',
					scope: 1,
				},
				{
					actionIds: ['ACCESS_IN_CONTROL_PANEL'],
					primaryKey: companyId,
					resourceName:
						'com_liferay_account_admin_web_internal_portlet_AccountEntriesAdminPortlet',
					scope: 1,
				},
			],
			roleType: 'organization',
		});

		await apiHelpers.headlessAdminUser.assignUserToOrganizationRole(
			role.id,
			user.id,
			organization1.id
		);

		const account = await apiHelpers.headlessAdminUser.postAccount();
		apiHelpers.data.push({id: account.id, type: 'account'});

		await apiHelpers.headlessAdminUser.postAccountOrganization(
			account.id,
			organization1.id
		);

		await usersAndOrganizationsPage.goToUsers();

		await (
			await usersAndOrganizationsPage.usersTableRowActions(
				`${user.alternateName}`
			)
		).click();

		const pagePromise = context.waitForEvent('page');

		await usersAndOrganizationsPage.impersonateUserMenuItem.click();

		const newPage = await pagePromise;
		accountsPage = new AccountsPage(newPage);

		await accountsPage.goto();
		await (await accountsPage.accountsTable.cellLink(account.name)).click();
		await accountsPage.organizationsTab.click();

		await expect(accountsPage.accountsTable.newButton).toHaveCount(0);
	});
});

test('LPD-30009 Account admin can unassign organization from account', async ({
	accountManagementWidgetPage,
	accountOrganizationsPage,
	apiHelpers,
	page,
}) => {
	page.on('dialog', (dialog) => dialog.accept());

	const userAccount = await apiHelpers.headlessAdminUser.postUserAccount();

	userData[userAccount.alternateName] = {
		name: userAccount.givenName,
		password: 'test',
		surname: userAccount.familyName,
	};

	const site = await apiHelpers.headlessSite.createSite({
		name: getRandomString(),
	});

	apiHelpers.data.push({id: site.id, type: 'site'});

	const layout = await apiHelpers.headlessDelivery.createSitePage({
		pageDefinition: getPageDefinition([
			getWidgetDefinition({
				id: getRandomString(),
				widgetName:
					'com_liferay_account_admin_web_internal_portlet_AccountEntriesManagementPortlet',
			}),
		]),
		siteId: site.id,
		title: getRandomString(),
	});

	const companyId = await page.evaluate(() => {
		return Liferay.ThemeDisplay.getCompanyId();
	});

	const roleWithAccountAdminPermissions =
		await postRoleWithAccountAdminPermissions(apiHelpers, companyId);

	const account = await apiHelpers.headlessAdminUser.postAccount({
		name: 'Account' + getRandomInt(),
		type: 'business',
	});

	apiHelpers.data.push({id: account.id, type: 'account'});

	await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
		account.id,
		[userAccount.emailAddress]
	);

	const rolesResponse = await apiHelpers.headlessAdminUser.getAccountRoles(
		account.id
	);

	const role = rolesResponse?.items?.filter(
		(role) => role.name === roleWithAccountAdminPermissions.name
	);

	await apiHelpers.headlessAdminUser.assignUserToAccountRole(
		account.id,
		role[0].id,
		userAccount.id
	);

	const organization = await apiHelpers.headlessAdminUser.postOrganization();

	await apiHelpers.headlessAdminUser.assignAccountToOrganization(
		account.id,
		organization.id
	);

	await performLogout(page);
	await performLogin(page, userAccount.alternateName);

	try {
		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await accountManagementWidgetPage.accountNameLink(account.name).click();
		await accountManagementWidgetPage.organizationsTab.click();
		await accountOrganizationsPage.organizationsTable.selectAllItemsCheckbox.click();
		await accountOrganizationsPage.removeButton.click();

		await accountManagementWidgetPage.searchInput.waitFor();

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);
		await expect(
			accountOrganizationsPage.organizationsTable.cell(organization.name)
		).toHaveCount(0);
	}
	finally {
		await performLogout(page);
		await performLogin(page, 'test');
	}
});

test('LPD-30004 Account admin can unassign organizations in bulk', async ({
	accountManagementWidgetPage,
	accountOrganizationsPage,
	apiHelpers,
	page,
}) => {
	test.setTimeout(120000);

	page.on('dialog', (dialog) => dialog.accept());

	const userAccount = await apiHelpers.headlessAdminUser.postUserAccount();

	userData[userAccount.alternateName] = {
		name: userAccount.givenName,
		password: 'test',
		surname: userAccount.familyName,
	};

	const site = await apiHelpers.headlessSite.createSite({
		name: getRandomString(),
	});

	apiHelpers.data.push({id: site.id, type: 'site'});

	const layout = await apiHelpers.headlessDelivery.createSitePage({
		pageDefinition: getPageDefinition([
			getWidgetDefinition({
				id: getRandomString(),
				widgetName:
					'com_liferay_account_admin_web_internal_portlet_AccountEntriesManagementPortlet',
			}),
		]),
		siteId: site.id,
		title: getRandomString(),
	});

	const companyId = await page.evaluate(() => {
		return Liferay.ThemeDisplay.getCompanyId();
	});

	const roleWithAccountAdminPermissions =
		await postRoleWithAccountAdminPermissions(apiHelpers, companyId);

	const account = await apiHelpers.headlessAdminUser.postAccount({
		name: 'Account' + getRandomInt(),
		type: 'business',
	});

	apiHelpers.data.push({id: account.id, type: 'account'});

	await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
		account.id,
		[userAccount.emailAddress]
	);

	const rolesResponse = await apiHelpers.headlessAdminUser.getAccountRoles(
		account.id
	);

	const role = rolesResponse?.items?.filter(
		(role) => role.name === roleWithAccountAdminPermissions.name
	);

	await apiHelpers.headlessAdminUser.assignUserToAccountRole(
		account.id,
		role[0].id,
		userAccount.id
	);

	const organization1 = await apiHelpers.headlessAdminUser.postOrganization();
	const organization2 = await apiHelpers.headlessAdminUser.postOrganization();
	const organization3 = await apiHelpers.headlessAdminUser.postOrganization();
	const organization4 = await apiHelpers.headlessAdminUser.postOrganization();

	await apiHelpers.headlessAdminUser.assignAccountToOrganization(
		account.id,
		organization1.id
	);
	await apiHelpers.headlessAdminUser.assignAccountToOrganization(
		account.id,
		organization2.id
	);
	await apiHelpers.headlessAdminUser.assignAccountToOrganization(
		account.id,
		organization3.id
	);
	await apiHelpers.headlessAdminUser.assignAccountToOrganization(
		account.id,
		organization4.id
	);

	await performLogout(page);
	await performLogin(page, userAccount.alternateName);

	await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

	await accountManagementWidgetPage.accountNameLink(account.name).click();
	await accountManagementWidgetPage.organizationsTab.click();
	await accountOrganizationsPage.organizationsTable.selectAllItemsCheckbox.click();
	await accountOrganizationsPage.removeButton.click();

	await accountManagementWidgetPage.searchInput.waitFor();

	await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

	await expect(
		accountOrganizationsPage.organizationsTable.cell(organization1.name)
	).toHaveCount(0);
	await expect(
		accountOrganizationsPage.organizationsTable.cell(organization2.name)
	).toHaveCount(0);
	await expect(
		accountOrganizationsPage.organizationsTable.cell(organization3.name)
	).toHaveCount(0);
	await expect(
		accountOrganizationsPage.organizationsTable.cell(organization4.name)
	).toHaveCount(0);
});

test('LPD-45328 Can change pagination in accounts', async ({
	accountManagementWidgetPage,
	apiHelpers,
	page,
}) => {
	page.on('dialog', (dialog) => dialog.accept());

	const userAccount = await apiHelpers.headlessAdminUser.postUserAccount();

	userData[userAccount.alternateName] = {
		name: userAccount.givenName,
		password: 'test',
		surname: userAccount.familyName,
	};

	for (let i = 1; i < 7; i++) {
		const account = await apiHelpers.headlessAdminUser.postAccount({
			name: `Account ${i}`,
			type: 'business',
		});

		apiHelpers.data.push({id: account.id, type: 'account'});

		await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
			account.id,
			[userAccount.emailAddress]
		);

		if (i === 1) {
			const rolesResponse =
				await apiHelpers.headlessAdminUser.getAccountRoles(account.id);

			const accountAdminRole = rolesResponse?.items?.filter(
				(role) => role.name === 'Account Administrator'
			);

			await apiHelpers.headlessAdminUser.assignUserToAccountRole(
				account.id,
				accountAdminRole[0].id,
				userAccount.id
			);
		}
	}

	const site = await apiHelpers.headlessSite.createSite({
		name: getRandomString(),
	});

	apiHelpers.data.push({id: site.id, type: 'site'});

	const layout = await apiHelpers.headlessDelivery.createSitePage({
		pageDefinition: getPageDefinition([
			getWidgetDefinition({
				id: getRandomString(),
				widgetName:
					'com_liferay_account_admin_web_internal_portlet_AccountEntriesManagementPortlet',
			}),
		]),
		siteId: site.id,
		title: getRandomString(),
	});

	await performLogout(page);
	await performLogin(page, userAccount.alternateName);

	await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

	await page.waitForLoadState('domcontentloaded');

	await setItemsPerPage(page, '4');

	await expect(
		page.getByText('Showing 1 to 4 of 6 entries.', {exact: true})
	).toBeVisible();

	for (let i = 1; i < 7; i++) {
		if (i < 5) {
			await expect(
				accountManagementWidgetPage.accountCell(`Account ${i}`)
			).toBeVisible();
		}
		else {
			await expect(
				accountManagementWidgetPage.accountCell(`Account ${i}`)
			).not.toBeVisible();
		}
	}

	await nextPage(page);

	await expect(page.getByText('Showing 5 to 6 of 6 entries.')).toBeVisible();

	for (let i = 1; i < 7; i++) {
		if (i < 5) {
			await expect(
				accountManagementWidgetPage.accountCell(`Account ${i}`)
			).not.toBeVisible();
		}
		else {
			await expect(
				accountManagementWidgetPage.accountCell(`Account ${i}`)
			).toBeVisible();
		}
	}

	await setItemsPerPage(page, '8');

	await expect(page.getByText('Showing 1 to 6 of 6 entries.')).toBeVisible();

	for (let i = 1; i < 7; i++) {
		await expect(
			accountManagementWidgetPage.accountCell(`Account ${i}`)
		).toBeVisible();
	}
});

test(
	'Account Admin can edit an account he is assigned to',
	{
		tag: ['@codice'],
	},
	async ({
		accountManagementWidgetPage,
		apiHelpers,
		editAccountPage,
		page,
		site,
	}) => {
		const layout = await apiHelpers.headlessDelivery.createSitePage({
			pageDefinition: getPageDefinition([
				getWidgetDefinition({
					id: getRandomString(),
					widgetName:
						'com_liferay_account_admin_web_internal_portlet_AccountEntriesManagementPortlet',
				}),
			]),
			siteId: site.id,
			title: getRandomString(),
		});

		const {account, userAccountManager} =
			await initAccountAdmin(apiHelpers);

		await performLogout(page);
		await performLoginViaApi(page, userAccountManager.alternateName);

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountNameLink(account.name)
		).toBeVisible();
		await expect(
			await accountManagementWidgetPage.accountsTable.rowActions(
				account.name
			)
		).toBeVisible();

		await accountManagementWidgetPage.accountNameLink(account.name).click();

		const name = getRandomString();

		await editAccountPage.accountNameInput.fill(name);

		await editAccountPage.saveButton.click();

		await waitForAlert(page);

		await editAccountPage.backButton.click();

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountNameLink(name)
		).toBeVisible();
		await expect(
			await accountManagementWidgetPage.accountsTable.rowActions(name)
		).toBeVisible();
	}
);

test(
	'Account Admin with Add Account Entry permission can create a new account',
	{
		tag: ['@codice'],
	},
	async ({
		accountManagementWidgetPage,
		apiHelpers,
		editAccountPage,
		page,
		site,
	}) => {
		const layout = await apiHelpers.headlessDelivery.createSitePage({
			pageDefinition: getPageDefinition([
				getWidgetDefinition({
					id: getRandomString(),
					widgetName:
						'com_liferay_account_admin_web_internal_portlet_AccountEntriesManagementPortlet',
				}),
			]),
			siteId: site.id,
			title: getRandomString(),
		});

		const {account, userAccountManager} =
			await initAccountAdmin(apiHelpers);

		await performLogout(page);
		await performLoginViaApi(page, userAccountManager.alternateName);

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountNameLink(account.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.newButton
		).toHaveCount(0);

		await performLogout(page);
		await performLoginViaApi(page, 'test');

		const regularRole = await apiHelpers.headlessAdminUser.postRole({
			name: getRandomString(),
			rolePermissions: [
				{
					actionIds: ['ADD_ACCOUNT_ENTRY'],
					primaryKey: await page.evaluate(() => {
						return Liferay.ThemeDisplay.getCompanyId();
					}),
					resourceName: '90',
					scope: 1,
				},
			],
			roleType: 'regular',
		});

		await apiHelpers.headlessAdminUser.assignUserToRole(
			regularRole.externalReferenceCode,
			userAccountManager.id
		);

		await performLogout(page);
		await performLoginViaApi(page, userAccountManager.alternateName);

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountNameLink(account.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.newButton
		).toBeVisible();

		await accountManagementWidgetPage.accountsTable.newButton.click();

		const name = getRandomString();

		await editAccountPage.createAccount(apiHelpers, {name});
		await editAccountPage.backButton.click();

		await expect(
			accountManagementWidgetPage.accountsTable.cell(name)
		).toBeVisible();
		await expect(
			await accountManagementWidgetPage.accountsTable.cellLink(name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountNameLink(name)
		).toBeVisible();
		await expect(
			await accountManagementWidgetPage.accountsTable.rowActions(name)
		).toBeVisible();
	}
);

test(
	'Account Admin with Delete permission can delete an account',
	{
		tag: ['@codice'],
	},
	async ({accountManagementWidgetPage, apiHelpers, page, site}) => {
		page.on('dialog', (dialog) => dialog.accept());

		const layout = await apiHelpers.headlessDelivery.createSitePage({
			pageDefinition: getPageDefinition([
				getWidgetDefinition({
					id: getRandomString(),
					widgetName:
						'com_liferay_account_admin_web_internal_portlet_AccountEntriesManagementPortlet',
				}),
			]),
			siteId: site.id,
			title: getRandomString(),
		});

		const {account, userAccountManager} =
			await initAccountAdmin(apiHelpers);

		await performLogout(page);
		await performLoginViaApi(page, userAccountManager.alternateName);

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountNameLink(account.name)
		).toBeVisible();
		await expect(
			await accountManagementWidgetPage.accountsTable.rowActions(
				account.name
			)
		).toBeVisible();
		await expect(async () => {
			await (
				await accountManagementWidgetPage.accountsTable.rowActions(
					account.name
				)
			).click();

			await expect(accountManagementWidgetPage.deleteButton).toHaveCount(
				0
			);
			await expect(
				accountManagementWidgetPage.deactivateButton
			).toHaveCount(0);
		}).toPass();

		await performLogout(page);
		await performLoginViaApi(page, 'test');

		const regularRole = await apiHelpers.headlessAdminUser.postRole({
			name: getRandomString(),
			rolePermissions: [
				{
					actionIds: ['DELETE'],
					primaryKey: '0',
					resourceName: 'com.liferay.account.model.AccountEntry',
					scope: 3,
				},
			],
			roleType: 'regular',
		});

		await apiHelpers.headlessAdminUser.assignUserToRole(
			regularRole.externalReferenceCode,
			userAccountManager.id
		);

		await performLogout(page);
		await performLoginViaApi(page, userAccountManager.alternateName);

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountNameLink(account.name)
		).toBeVisible();
		await expect(
			await accountManagementWidgetPage.accountsTable.rowActions(
				account.name
			)
		).toBeVisible();
		await expect(async () => {
			await (
				await accountManagementWidgetPage.accountsTable.rowActions(
					account.name
				)
			).click();

			await expect(
				accountManagementWidgetPage.deleteButton
			).toBeVisible();

			/* await expect(accountManagementWidgetPage.deactivateButton).toHaveCount(
				0
			);*/
		}).toPass();

		await accountManagementWidgetPage.deleteButton.click();

		await waitForAlert(page);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account.name)
		).toHaveCount(0);
	}
);

test(
	'Account Admin with Deactivate permission can deactivate an account',
	{
		tag: ['@codice'],
	},
	async ({accountManagementWidgetPage, apiHelpers, page, site}) => {
		page.on('dialog', (dialog) => dialog.accept());

		const layout = await apiHelpers.headlessDelivery.createSitePage({
			pageDefinition: getPageDefinition([
				getWidgetDefinition({
					id: getRandomString(),
					widgetName:
						'com_liferay_account_admin_web_internal_portlet_AccountEntriesManagementPortlet',
				}),
			]),
			siteId: site.id,
			title: getRandomString(),
		});

		const {account, userAccountManager} =
			await initAccountAdmin(apiHelpers);

		await performLogout(page);
		await performLoginViaApi(page, userAccountManager.alternateName);

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountNameLink(account.name)
		).toBeVisible();
		await expect(
			await accountManagementWidgetPage.accountsTable.rowActions(
				account.name
			)
		).toBeVisible();
		await expect(async () => {
			await (
				await accountManagementWidgetPage.accountsTable.rowActions(
					account.name
				)
			).click();

			await expect(accountManagementWidgetPage.deleteButton).toHaveCount(
				0
			);
			await expect(
				accountManagementWidgetPage.deactivateButton
			).toHaveCount(0);
		}).toPass();

		await performLogout(page);
		await performLoginViaApi(page, 'test');

		const regularRole = await apiHelpers.headlessAdminUser.postRole({
			name: getRandomString(),
			rolePermissions: [
				{
					actionIds: ['DELETE'] /* TODO: METTERE DEACTIVATE */,
					primaryKey: '0',
					resourceName: 'com.liferay.account.model.AccountEntry',
					scope: 3,
				},
			],
			roleType: 'regular',
		});

		await apiHelpers.headlessAdminUser.assignUserToRole(
			regularRole.externalReferenceCode,
			userAccountManager.id
		);

		await performLogout(page);
		await performLoginViaApi(page, userAccountManager.alternateName);

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountNameLink(account.name)
		).toBeVisible();
		await expect(
			await accountManagementWidgetPage.accountsTable.rowActions(
				account.name
			)
		).toBeVisible();
		await expect(async () => {
			await (
				await accountManagementWidgetPage.accountsTable.rowActions(
					account.name
				)
			).click();

			/* await expect(
				accountManagementWidgetPage.deleteButton
			).toHaveCount(0);*/
			await expect(
				accountManagementWidgetPage.deactivateButton
			).toBeVisible();
		}).toPass();

		await accountManagementWidgetPage.deactivateButton.click();

		await waitForAlert(page);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account.name)
		).toHaveCount(0);

		await expect(async () => {
			await accountManagementWidgetPage.accountsTable.filterButton.click();

			await accountManagementWidgetPage.accountsTable
				.filterMenuItem('Inactive')
				.click();

			await expect(
				accountManagementWidgetPage.accountsTable.cell(account.name)
			).toBeVisible();
		}).toPass();
	}
);

test(
	'Account Member can search accounts he is assigned to by name and ID',
	{
		tag: ['@codice', '@LRQA-73702'],
	},
	async ({accountManagementWidgetPage, apiHelpers, page, site}) => {
		const layout = await apiHelpers.headlessDelivery.createSitePage({
			pageDefinition: getPageDefinition([
				getWidgetDefinition({
					id: getRandomString(),
					widgetName:
						'com_liferay_account_admin_web_internal_portlet_AccountEntriesManagementPortlet',
				}),
			]),
			siteId: site.id,
			title: getRandomString(),
		});

		const account1 = await apiHelpers.headlessAdminUser.postAccount();

		apiHelpers.data.push({id: account1.id, type: 'account'});

		const account2 = await apiHelpers.headlessAdminUser.postAccount();

		apiHelpers.data.push({id: account2.id, type: 'account'});

		const account3 = await apiHelpers.headlessAdminUser.postAccount();

		apiHelpers.data.push({id: account3.id, type: 'account'});

		const user = await apiHelpers.headlessAdminUser.postUserAccount();

		userData[user.alternateName] = {
			name: user.givenName,
			password: 'test',
			surname: user.familyName,
		};

		await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
			account1.id,
			[user.emailAddress]
		);

		await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
			account2.id,
			[user.emailAddress]
		);

		await performLogout(page);
		await performLoginViaApi(page, user.alternateName);

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account3.name)
		).toHaveCount(0);

		await accountManagementWidgetPage.accountsTable.search(
			getRandomString()
		);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account3.name)
		).toHaveCount(0);

		await accountManagementWidgetPage.accountsTable.search(account1.name);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account3.name)
		).toHaveCount(0);

		await accountManagementWidgetPage.accountsTable.search(account2.name);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account3.name)
		).toHaveCount(0);

		await accountManagementWidgetPage.accountsTable.search(account3.name);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account3.name)
		).toHaveCount(0);

		await accountManagementWidgetPage.accountsTable.search('');

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account3.name)
		).toHaveCount(0);

		await accountManagementWidgetPage.accountsTable.search(
			String(getRandomInt())
		);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account3.name)
		).toHaveCount(0);

		await accountManagementWidgetPage.accountsTable.search(
			String(account1.id)
		);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account3.name)
		).toHaveCount(0);

		await accountManagementWidgetPage.accountsTable.search(
			String(account2.id)
		);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account3.name)
		).toHaveCount(0);

		await accountManagementWidgetPage.accountsTable.search(
			String(account3.id)
		);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account3.name)
		).toHaveCount(0);
	}
);

test(
	'Account Member can filter accounts he is assigned to by status',
	{
		tag: ['@codice'],
	},
	async ({accountManagementWidgetPage, apiHelpers, page, site}) => {
		const layout = await apiHelpers.headlessDelivery.createSitePage({
			pageDefinition: getPageDefinition([
				getWidgetDefinition({
					id: getRandomString(),
					widgetName:
						'com_liferay_account_admin_web_internal_portlet_AccountEntriesManagementPortlet',
				}),
			]),
			siteId: site.id,
			title: getRandomString(),
		});

		const account1 = await apiHelpers.headlessAdminUser.postAccount();

		apiHelpers.data.push({id: account1.id, type: 'account'});

		const account2 = await apiHelpers.headlessAdminUser.postAccount({
			status: 5,
		});

		apiHelpers.data.push({id: account2.id, type: 'account'});

		const user = await apiHelpers.headlessAdminUser.postUserAccount();

		userData[user.alternateName] = {
			name: user.givenName,
			password: 'test',
			surname: user.familyName,
		};

		await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
			account1.id,
			[user.emailAddress]
		);

		await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
			account2.id,
			[user.emailAddress]
		);

		await performLogout(page);
		await performLoginViaApi(page, user.alternateName);

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toHaveCount(0);

		await expect(async () => {
			await accountManagementWidgetPage.accountsTable.filterButton.click();

			await expect(
				accountManagementWidgetPage.accountsTable.filterMenuItem(
					'Inactive'
				)
			).toBeVisible();
		}).toPass();

		await accountManagementWidgetPage.accountsTable
			.filterMenuItem('Inactive')
			.click();

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toBeVisible();

		await expect(async () => {
			await accountManagementWidgetPage.accountsTable.filterButton.click();

			await expect(
				accountManagementWidgetPage.accountsTable.filterMenuItem('All')
			).toBeVisible();
		}).toPass();

		await accountManagementWidgetPage.accountsTable
			.filterMenuItem('All')
			.click();

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toBeVisible();

		await expect(async () => {
			await accountManagementWidgetPage.accountsTable.filterButton.click();

			await expect(
				accountManagementWidgetPage.accountsTable.filterMenuItem(
					'Active'
				)
			).toBeVisible();
		}).toPass();

		await accountManagementWidgetPage.accountsTable
			.filterMenuItem('Active')
			.click();

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toHaveCount(0);
	}
);

test(
	'Account Member can filter accounts he is assigned to by type',
	{
		tag: ['@codice'],
	},
	async ({accountManagementWidgetPage, apiHelpers, page, site}) => {
		const layout = await apiHelpers.headlessDelivery.createSitePage({
			pageDefinition: getPageDefinition([
				getWidgetDefinition({
					id: getRandomString(),
					widgetName:
						'com_liferay_account_admin_web_internal_portlet_AccountEntriesManagementPortlet',
				}),
			]),
			siteId: site.id,
			title: getRandomString(),
		});

		const account1 = await apiHelpers.headlessAdminUser.postAccount();

		apiHelpers.data.push({id: account1.id, type: 'account'});

		const account2 = await apiHelpers.headlessAdminUser.postAccount({
			type: 'person',
		});

		apiHelpers.data.push({id: account2.id, type: 'account'});

		const user = await apiHelpers.headlessAdminUser.postUserAccount();

		userData[user.alternateName] = {
			name: user.givenName,
			password: 'test',
			surname: user.familyName,
		};

		await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
			account1.id,
			[user.emailAddress]
		);

		await apiHelpers.headlessAdminUser.assignUserToAccountByEmailAddress(
			account2.id,
			[user.emailAddress]
		);

		await performLogout(page);
		await performLoginViaApi(page, user.alternateName);

		await page.goto(`/web/${site.name}/${layout.friendlyUrlPath}`);

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toBeVisible();

		await expect(async () => {
			await accountManagementWidgetPage.accountsTable.filterButton.click();

			await expect(
				accountManagementWidgetPage.accountsTable.filterMenuItem(
					'Business'
				)
			).toBeVisible();
		}).toPass();

		await accountManagementWidgetPage.accountsTable
			.filterMenuItem('Business')
			.click();

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toBeVisible();
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toHaveCount(0);

		await expect(async () => {
			await accountManagementWidgetPage.accountsTable.filterButton.click();

			await expect(
				accountManagementWidgetPage.accountsTable.filterMenuItem(
					'Person'
				)
			).toBeVisible();
		}).toPass();

		await accountManagementWidgetPage.accountsTable
			.filterMenuItem('Person')
			.click();

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toBeVisible();

		await expect(async () => {
			await accountManagementWidgetPage.accountsTable.filterButton.click();

			await expect(
				accountManagementWidgetPage.accountsTable.filterMenuItem(
					'Supplier'
				)
			).toBeVisible();
		}).toPass();

		await accountManagementWidgetPage.accountsTable
			.filterMenuItem('Supplier')
			.click();

		await expect(
			accountManagementWidgetPage.accountsTable.cell(account1.name)
		).toHaveCount(0);
		await expect(
			accountManagementWidgetPage.accountsTable.cell(account2.name)
		).toHaveCount(0);
	}
);
