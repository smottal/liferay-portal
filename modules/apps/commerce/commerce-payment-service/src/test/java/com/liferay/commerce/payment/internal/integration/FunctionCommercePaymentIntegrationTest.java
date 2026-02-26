/**
 * SPDX-FileCopyrightText: (c) 2026 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

package com.liferay.commerce.payment.internal.integration;

import com.liferay.commerce.payment.internal.configuration.FunctionCommercePaymentIntegrationConfiguration;
import com.liferay.commerce.payment.model.CommercePaymentEntry;
import com.liferay.commerce.payment.model.CommercePaymentMethodGroupRel;
import com.liferay.commerce.payment.model.impl.CommercePaymentEntryImpl;
import com.liferay.commerce.payment.service.CommercePaymentMethodGroupRelLocalService;
import com.liferay.commerce.product.model.CommerceChannel;
import com.liferay.commerce.product.service.CommerceChannelLocalService;
import com.liferay.portal.catapult.PortalCatapult;
import com.liferay.portal.json.JSONObjectImpl;
import com.liferay.portal.kernel.json.JSONFactory;
import com.liferay.portal.kernel.json.JSONUtil;
import com.liferay.portal.kernel.language.Language;
import com.liferay.portal.kernel.language.LanguageUtil;
import com.liferay.portal.kernel.resource.bundle.ResourceBundleLoader;
import com.liferay.portal.kernel.resource.bundle.ResourceBundleLoaderUtil;
import com.liferay.portal.kernel.test.ReflectionTestUtil;
import com.liferay.portal.kernel.test.util.RandomTestUtil;
import com.liferay.portal.kernel.util.BigDecimalUtil;
import com.liferay.portal.kernel.util.HashMapBuilder;
import com.liferay.portal.kernel.util.Portal;
import com.liferay.portal.kernel.util.ResourceBundleUtil;
import com.liferay.portal.test.rule.LiferayUnitTestRule;

import jakarta.servlet.http.HttpServletRequest;

import java.math.BigDecimal;

import java.util.Locale;
import java.util.ResourceBundle;
import java.util.concurrent.Future;

import org.junit.Assert;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;

import org.mockito.Mockito;

/**
 * @author Crescenzo Rega
 */
public class FunctionCommercePaymentIntegrationTest {

	@ClassRule
	@Rule
	public static final LiferayUnitTestRule liferayUnitTestRule =
		LiferayUnitTestRule.INSTANCE;

	@Before
	public void setUp() throws Exception {
		_setUpCommerceChannelLocalService();
		_setUpCommercePaymentMethodGroupRelLocalService();
		_setUpFunctionCommercePaymentIntegrationConfiguration();
		_setUpLanguage();
		_setUpPortal();
		_setUpPortalCatapult();

		_setUpFunctionCommercePaymentIntegration();
	}

	@Test
	public void testAuthorize() throws Exception {
		double amount = 0.0;

		ReflectionTestUtil.setFieldValue(
			_functionCommercePaymentIntegration, "_jsonFactory",
			_mockJSONFactory(amount));

		HttpServletRequest httpServletRequest = Mockito.mock(
			HttpServletRequest.class);

		Mockito.when(
			httpServletRequest.getParameterMap()
		).thenReturn(
			HashMapBuilder.put(
				RandomTestUtil.randomString(),
				new String[] {RandomTestUtil.randomString()}
			).build()
		);

		CommercePaymentEntry commercePaymentEntry =
			_functionCommercePaymentIntegration.authorize(
				httpServletRequest, _createCommercePaymentEntry());

		Assert.assertTrue(
			BigDecimalUtil.eq(
				commercePaymentEntry.getAmount(), BigDecimal.valueOf(amount)));
	}

	@Test
	public void testCapture() throws Exception {
		double amount = 1.0;

		ReflectionTestUtil.setFieldValue(
			_functionCommercePaymentIntegration, "_jsonFactory",
			_mockJSONFactory(amount));

		HttpServletRequest httpServletRequest = Mockito.mock(
			HttpServletRequest.class);

		Mockito.when(
			httpServletRequest.getParameterMap()
		).thenReturn(
			HashMapBuilder.put(
				RandomTestUtil.randomString(),
				new String[] {RandomTestUtil.randomString()}
			).build()
		);

		CommercePaymentEntry commercePaymentEntry =
			_functionCommercePaymentIntegration.capture(
				httpServletRequest, _createCommercePaymentEntry());

		Assert.assertTrue(
			BigDecimalUtil.eq(
				commercePaymentEntry.getAmount(), BigDecimal.valueOf(amount)));
	}

	@Test
	public void testSetUpPayment() throws Exception {
		double amount = 25.60;

		ReflectionTestUtil.setFieldValue(
			_functionCommercePaymentIntegration, "_jsonFactory",
			_mockJSONFactory(amount));

		HttpServletRequest httpServletRequest = Mockito.mock(
			HttpServletRequest.class);

		Mockito.when(
			httpServletRequest.getParameterMap()
		).thenReturn(
			HashMapBuilder.put(
				RandomTestUtil.randomString(),
				new String[] {RandomTestUtil.randomString()}
			).build()
		);

		CommercePaymentEntry commercePaymentEntry =
			_functionCommercePaymentIntegration.capture(
				httpServletRequest, _createCommercePaymentEntry());

		Assert.assertTrue(
			BigDecimalUtil.eq(
				commercePaymentEntry.getAmount(), BigDecimal.valueOf(amount)));
	}

	private CommercePaymentEntry _createCommercePaymentEntry() {
		CommercePaymentEntry commercePaymentEntry =
			new CommercePaymentEntryImpl();

		commercePaymentEntry.setCompanyId(RandomTestUtil.randomLong());
		commercePaymentEntry.setUserId(RandomTestUtil.randomLong());
		commercePaymentEntry.setClassNameId(RandomTestUtil.randomLong());
		commercePaymentEntry.setCommerceChannelId(RandomTestUtil.randomLong());
		commercePaymentEntry.setLanguageId("en_US");

		return commercePaymentEntry;
	}

	private JSONFactory _mockJSONFactory(double amount) throws Exception {
		JSONFactory jsonFactory = Mockito.mock(JSONFactory.class);

		Mockito.when(
			jsonFactory.createJSONObject(Mockito.anyString())
		).thenReturn(
			JSONUtil.put(
				"amount", amount
			).put(
				"paymentStatus", 2
			).put(
				"transactionCode", RandomTestUtil.randomString()
			)
		);

		Mockito.when(
			jsonFactory.looseSerializeDeep(Mockito.any())
		).thenReturn(
			RandomTestUtil.randomString()
		);

		Mockito.when(
			jsonFactory.createJSONObject()
		).thenReturn(
			new JSONObjectImpl()
		);

		return jsonFactory;
	}

	private void _setUpCommerceChannelLocalService() throws Exception {
		CommerceChannel commerceChannel = Mockito.mock(CommerceChannel.class);

		Mockito.when(
			commerceChannel.getGroupId()
		).thenReturn(
			RandomTestUtil.randomLong()
		);

		_commerceChannelLocalService = Mockito.mock(
			CommerceChannelLocalService.class);

		Mockito.when(
			_commerceChannelLocalService.getCommerceChannel(Mockito.anyLong())
		).thenReturn(
			commerceChannel
		);
	}

	private void _setUpCommercePaymentMethodGroupRelLocalService() {
		CommercePaymentMethodGroupRel commercePaymentMethodGroupRel =
			Mockito.mock(CommercePaymentMethodGroupRel.class);

		Mockito.when(
			commercePaymentMethodGroupRel.getTypeSettingsUnicodeProperties()
		).thenReturn(
			RandomTestUtil.randomUnicodeProperties(4, 3, 3)
		);

		_commercePaymentMethodGroupRelLocalService = Mockito.mock(
			CommercePaymentMethodGroupRelLocalService.class);

		Mockito.when(
			_commercePaymentMethodGroupRelLocalService.
				fetchCommercePaymentMethodGroupRel(
					Mockito.anyLong(), Mockito.anyString())
		).thenReturn(
			commercePaymentMethodGroupRel
		);
	}

	private void _setUpFunctionCommercePaymentIntegration() {
		_functionCommercePaymentIntegration =
			new FunctionCommercePaymentIntegration();

		ReflectionTestUtil.setFieldValue(
			_functionCommercePaymentIntegration, "_commerceChannelLocalService",
			_commerceChannelLocalService);
		ReflectionTestUtil.setFieldValue(
			_functionCommercePaymentIntegration,
			"_commercePaymentMethodGroupRelLocalService",
			_commercePaymentMethodGroupRelLocalService);
		ReflectionTestUtil.setFieldValue(
			_functionCommercePaymentIntegration,
			"_functionCommercePaymentIntegrationConfiguration",
			_functionCommercePaymentIntegrationConfiguration);
		ReflectionTestUtil.setFieldValue(
			_functionCommercePaymentIntegration, "_language", _language);
		ReflectionTestUtil.setFieldValue(
			_functionCommercePaymentIntegration, "_portal", _portal);
		ReflectionTestUtil.setFieldValue(
			_functionCommercePaymentIntegration, "_portalCatapult",
			_portalCatapult);
	}

	private void _setUpFunctionCommercePaymentIntegrationConfiguration() {
		_functionCommercePaymentIntegrationConfiguration = Mockito.mock(
			FunctionCommercePaymentIntegrationConfiguration.class);

		Mockito.when(
			_functionCommercePaymentIntegrationConfiguration.key()
		).thenReturn(
			RandomTestUtil.randomString()
		);

		Mockito.when(
			_functionCommercePaymentIntegrationConfiguration.name()
		).thenReturn(
			RandomTestUtil.randomString()
		);

		Mockito.when(
			_functionCommercePaymentIntegrationConfiguration.
				oAuth2ApplicationExternalReferenceCode()
		).thenReturn(
			RandomTestUtil.randomString()
		);

		Mockito.when(
			_functionCommercePaymentIntegrationConfiguration.
				paymentIntegrationType()
		).thenReturn(
			RandomTestUtil.randomInt()
		);

		Mockito.when(
			_functionCommercePaymentIntegrationConfiguration.
				paymentIntegrationTypeSettings()
		).thenReturn(
			RandomTestUtil.randomString()
		);
	}

	private void _setUpLanguage() throws Exception {
		ResourceBundleLoader resourceBundleLoader = Mockito.mock(
			ResourceBundleLoader.class);

		ResourceBundleLoaderUtil.setPortalResourceBundleLoader(
			resourceBundleLoader);

		Mockito.when(
			resourceBundleLoader.loadResourceBundle(Mockito.any())
		).thenReturn(
			ResourceBundleUtil.EMPTY_RESOURCE_BUNDLE
		);

		_language = Mockito.mock(Language.class);

		Mockito.when(
			_language.get(
				Mockito.any(ResourceBundle.class), Mockito.anyString())
		).thenReturn(
			RandomTestUtil.randomString()
		);

		Mockito.when(
			_language.isAvailableLocale(Mockito.any(Locale.class))
		).thenReturn(
			true
		);

		ReflectionTestUtil.setFieldValue(
			LanguageUtil.class, "_language", _language);
	}

	private void _setUpPortal() {
		_portal = Mockito.mock(Portal.class);

		Mockito.when(
			_portal.getClassName(Mockito.anyLong())
		).thenReturn(
			RandomTestUtil.randomString()
		);
	}

	private void _setUpPortalCatapult() throws Exception {
		Future<byte[]> future = Mockito.mock(Future.class);

		Mockito.when(
			future.get()
		).thenReturn(
			RandomTestUtil.randomBytes()
		);

		_portalCatapult = Mockito.mock(PortalCatapult.class);

		Mockito.when(
			_portalCatapult.launch(
				Mockito.anyLong(), Mockito.any(), Mockito.anyString(),
				Mockito.any(), Mockito.anyString(), Mockito.anyLong())
		).thenReturn(
			future
		);
	}

	private CommerceChannelLocalService _commerceChannelLocalService;
	private CommercePaymentMethodGroupRelLocalService
		_commercePaymentMethodGroupRelLocalService;
	private FunctionCommercePaymentIntegration
		_functionCommercePaymentIntegration;
	private FunctionCommercePaymentIntegrationConfiguration
		_functionCommercePaymentIntegrationConfiguration;
	private Language _language;
	private Portal _portal;
	private PortalCatapult _portalCatapult;

}