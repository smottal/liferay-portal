/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */
import {TDataHelper} from "./DataHelper";

const basePath = 'headless-commerce-admin-payment/v1.0';

export class HeadlessCommerceAdminPaymentApiHelper {
	readonly apiHelpers: any;
	readonly dataHelper: TDataHelper;

	constructor(apiHelpers: any, dataHelper: TDataHelper) {
		this.apiHelpers = apiHelpers;
		this.dataHelper = dataHelper;
	}

	async deletePayment(
		apiHelpers = this.apiHelpers,
		paymentId: number
	) {
		return apiHelpers.delete(
			`${apiHelpers.baseUrl}${basePath}/payments/${paymentId}`
		);
	}

	async patchPayment(
		paymentId: number,
		payment: TCommercePayment
	): Promise<TCommercePayment> {
		return this.apiHelpers.patch(
			`${this.apiHelpers.baseUrl}${basePath}/payments/${paymentId}`,
			payment
		);
	}

	async postRandomPayment(
		payment: TCommercePayment
	): Promise<TCommercePayment> {
		const postPayment = await this.apiHelpers.post(
			`${this.apiHelpers.baseUrl}${basePath}/payments`,
			payment
		);

		this.dataHelper.addDataObject({handleDelete: this.deletePayment, id: postPayment.id});

		return postPayment;
	}
}

export type TCommercePayment = {
	amount?: number;
	channelId?: number;
	currencyCode?: string;
	externalReferenceCode?: string;
	paymentIntegrationKey?: string;
	paymentIntegrationType?: number;
	paymentStatus?: number;
	relatedItemId?: number;
	relatedItemName?: string;
	type?: number;
}