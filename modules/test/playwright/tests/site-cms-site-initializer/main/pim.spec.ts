/**
 * SPDX-FileCopyrightText: (c) 2025 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import {expect, mergeTests} from '@playwright/test';

import {dataApiHelpersTest} from '../../../fixtures/dataApiHelpersTest';
import {featureFlagsTest} from '../../../fixtures/featureFlagsTest';
import {loginTest} from '../../../fixtures/loginTest';
import {clickAndExpectToBeVisible} from '../../../utils/clickAndExpectToBeVisible';
import getRandomString from '../../../utils/getRandomString';
import {hoverAndExpectToBeVisible} from '../../../utils/hoverAndExpectToBeVisible';
import {waitForAlert} from '../../../utils/waitForAlert';

const test = mergeTests(
	dataApiHelpersTest,
	featureFlagsTest({'LPD-17564': {enabled: true}}),
	loginTest()
);

const PRODUCT_TYPES_FOLDER_ERC = 'L_PIM_PRODUCT_TYPES';

const STRUCTURE_BUILDER_URL = 'web/cms/structure-builder';

// The structure is created through the UI, so it is not tracked by the
// dataApiHelpers fixture. Capture its id on publish and delete it afterwards —
// no shared base SKU is mutated, so there is nothing to restore.

let objectDefinitionId: number | undefined;

test.afterEach(async ({apiHelpers}) => {
	if (objectDefinitionId) {
		await apiHelpers.deleteObjectDefinition(objectDefinitionId);

		objectDefinitionId = undefined;
	}
});

test(
	'Product structure fields group into panels and tabs that round-trip',
	{tag: '@LPD-96666'},
	async ({page}) => {
		const fieldLabel = `Field ${getRandomString()}`;
		const panelLabel = `Panel ${getRandomString()}`;
		const structureLabel = `Product ${getRandomString()}`;
		const tabLabel = `Tab ${getRandomString()}`;

		const addFieldButton = page.locator(
			'button[data-canonical-name="Add Field"]'
		);
		const labelTextbox = page.getByRole('textbox', {
			name: 'Label Mandatory',
		});
		const publishButton = page.getByRole('button', {name: 'Publish'});
		const structureLabelInput = page.getByLabel('Content Structure Label');

		const treeLink = (label: string) =>
			page.locator('.treeview-link', {hasText: label}).first();

		const expectNested = async ({
			child,
			parent,
		}: {
			child: string;
			parent: string;
		}) => {
			const parentLink = treeLink(parent);

			const childLink = page
				.locator('.treeview-item', {has: parentLink})
				.locator('.treeview-link', {hasText: child})
				.first();

			// Tree containers load collapsed, so expand the parent first.

			await expect(async () => {
				if (
					(await parentLink.getAttribute('aria-expanded')) !== 'true'
				) {
					await parentLink
						.locator('.component-expander')
						.first()
						.click({timeout: 1000});
				}

				await expect(childLink).toBeVisible({timeout: 1000});
			}).toPass({timeout: 10000});
		};

		const gotoBuilder = async (query: string) => {
			await expect(async () => {
				await page.goto(`${STRUCTURE_BUILDER_URL}?${query}`, {
					waitUntil: 'networkidle',
				});

				await expect(publishButton).toBeVisible({timeout: 5000});
			}).toPass({timeout: 30000});
		};

		// A tree item's "Field Options" button only appears while the row is
		// hovered, so hover the row first, then click the revealed button.

		const openItemMenu = async (itemLabel: string) => {
			const treeItem = page.getByRole('treeitem', {name: itemLabel});

			await hoverAndExpectToBeVisible({
				autoClick: true,
				target: treeItem.getByRole('button', {name: 'Field Options'}),
				trigger: treeItem,
			});
		};

		const publish = async () => {
			await publishButton.click();

			await waitForAlert(page, 'published successfully', {
				timeout: 10000,
			});

			const id = new URL(page.url()).searchParams.get(
				'objectDefinitionId'
			);

			if (id) {
				objectDefinitionId = Number(id);
			}
		};

		await test.step('Create a product structure seeded from the base SKU', async () => {
			await gotoBuilder(
				`objectFolderExternalReferenceCode=${PRODUCT_TYPES_FOLDER_ERC}`
			);

			// Name the structure (selecting the root reveals its settings).

			await clickAndExpectToBeVisible({
				target: structureLabelInput,
				trigger: page.locator('.treeview-link').first(),
			});

			await structureLabelInput.fill(structureLabel);
			await structureLabelInput.blur();
		});

		await test.step('Add a field and group it into a panel', async () => {
			await clickAndExpectToBeVisible({
				target: page.getByRole('menuitem', {exact: true, name: 'Text'}),
				trigger: addFieldButton,
			});
			await clickAndExpectToBeVisible({
				target: labelTextbox,
				trigger: page.getByRole('menuitem', {
					exact: true,
					name: 'Text',
				}),
			});

			await labelTextbox.fill(fieldLabel);

			// Blur so the tree row picks up the new label.

			await labelTextbox.blur();

			await openItemMenu(fieldLabel);

			await clickAndExpectToBeVisible({
				target: labelTextbox,
				trigger: page.getByRole('menuitem', {name: 'Create Panel'}),
			});

			await labelTextbox.fill(panelLabel);
			await labelTextbox.blur();

			await publish();
		});

		await test.step('Reopen the structure and verify the field persists inside the panel', async () => {
			await gotoBuilder(`objectDefinitionId=${objectDefinitionId}`);

			await expectNested({child: fieldLabel, parent: panelLabel});
		});

		await test.step('Wrap the panel in a tab', async () => {
			await openItemMenu(panelLabel);

			await clickAndExpectToBeVisible({
				target: labelTextbox,
				trigger: page.getByRole('menuitem', {name: 'Create Tab'}),
			});

			await labelTextbox.fill(tabLabel);
			await labelTextbox.blur();

			await publish();
		});

		await test.step('Reopen the structure and verify the tab holds the panel and field', async () => {
			await gotoBuilder(`objectDefinitionId=${objectDefinitionId}`);

			await expectNested({child: panelLabel, parent: tabLabel});
			await expectNested({child: fieldLabel, parent: panelLabel});
		});
	}
);
