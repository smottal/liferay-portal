/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
import {TDataHelper} from "./DataHelper";

const basePath = 'headless-admin-user/v1.0';

export class HeadlessAdminUserApiHelper {
	readonly apiHelpers: any;
	readonly dataHelper: TDataHelper;

	constructor(apiHelpers: any, dataHelper: TDataHelper) {
		this.apiHelpers = apiHelpers;
		this.dataHelper = dataHelper;
	}

	async deleteOrganization(
		apiHelpers: any = this.apiHelpers,
		organizationId: number
	) {
		return apiHelpers.delete(
			`${apiHelpers.baseUrl}${basePath}/organizations/${organizationId}`
		);
	}

	async getOrganizations(): Promise<TOrganization[]> {
		const response = await this.apiHelpers.get(
			`${this.apiHelpers.baseUrl}${basePath}/organizations`
		);

		return response.items || [];
	}

	async postRandomOrganization(
		organization: TOrganization
	): Promise<TOrganization> {
		const postOrganization: TOrganization = await this.apiHelpers.post(
			`${this.apiHelpers.baseUrl}${basePath}/organizations`,
			organization
		);

		this.dataHelper.addDataObject({handleDelete: this.deleteOrganization, id: postOrganization.id});

		return postOrganization;
	}
}

export type TOrganization = {
	externalReferenceCode?: string,
	id?: number,
	name?: string,
}