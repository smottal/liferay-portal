/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

package com.liferay.commerce.discount.internal.rule.type;

import com.liferay.commerce.context.CommerceContext;
import com.liferay.commerce.currency.model.CommerceMoney;
import com.liferay.commerce.currency.model.CommerceMoneyFactory;
import com.liferay.commerce.discount.application.strategy.CommerceDiscountApplicationStrategy;
import com.liferay.commerce.discount.application.strategy.CommerceDiscountApplicationStrategyRegistry;
import com.liferay.commerce.discount.constants.CommerceDiscountConstants;
import com.liferay.commerce.discount.constants.CommerceDiscountRuleConstants;
import com.liferay.commerce.discount.model.CommerceDiscount;
import com.liferay.commerce.discount.model.CommerceDiscountRule;
import com.liferay.commerce.discount.rule.type.CommerceDiscountRuleType;
import com.liferay.commerce.model.CommerceOrder;
import com.liferay.commerce.model.CommerceOrderItem;
import com.liferay.commerce.pricing.configuration.CommercePricingConfiguration;
import com.liferay.commerce.util.CommerceBigDecimalUtil;
import com.liferay.portal.kernel.exception.PortalException;
import com.liferay.portal.kernel.language.Language;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.module.configuration.ConfigurationException;
import com.liferay.portal.kernel.module.configuration.ConfigurationProvider;
import com.liferay.portal.kernel.util.ResourceBundleUtil;
import com.liferay.portal.kernel.util.Validator;

import java.math.BigDecimal;

import java.util.Locale;
import java.util.ResourceBundle;

import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

/**
 * @author Alessio Antonio Rendina
 * @author Stefano Motta
 */
@Component(
	property = {
		"commerce.discount.rule.type.key=" + CommerceDiscountRuleConstants.TYPE_CART_TOTAL,
		"commerce.discount.rule.type.order:Integer=10"
	},
	service = CommerceDiscountRuleType.class
)
public class CartTotalCommerceDiscountRuleTypeImpl
	implements CommerceDiscountRuleType {

	@Override
	public boolean evaluate(
			CommerceDiscount commerceDiscount,
			CommerceDiscountRule commerceDiscountRule,
			CommerceContext commerceContext)
		throws PortalException {

		CommerceOrder commerceOrder = commerceContext.getCommerceOrder();

		if (commerceOrder == null) {
			return false;
		}

		CommerceMoney orderPriceCommerceMoney = _calculateOrderSubtotal(
			commerceDiscount, commerceOrder, commerceContext);

		if (orderPriceCommerceMoney == null) {
			return false;
		}

		BigDecimal orderPrice = orderPriceCommerceMoney.getPrice();

		String settingsProperty = commerceDiscountRule.getSettingsProperty(
			commerceDiscountRule.getType());

		BigDecimal cartTotal = new BigDecimal(settingsProperty);

		if (CommerceBigDecimalUtil.gt(orderPrice, cartTotal)) {
			return true;
		}

		return false;
	}

	@Override
	public String getKey() {
		return CommerceDiscountRuleConstants.TYPE_CART_TOTAL;
	}

	@Override
	public String getLabel(Locale locale) {
		ResourceBundle resourceBundle = ResourceBundleUtil.getBundle(
			"content.Language", locale, getClass());

		return _language.get(
			resourceBundle, CommerceDiscountRuleConstants.TYPE_CART_TOTAL);
	}

	private CommerceMoney _calculateOrderSubtotal(
			CommerceDiscount commerceDiscount, CommerceOrder commerceOrder,
			CommerceContext commerceContext)
		throws PortalException {

		BigDecimal orderSubtotal = BigDecimal.ZERO;

		CommerceDiscountApplicationStrategy
			commerceDiscountApplicationStrategy =
				_getCommerceDiscountApplicationStrategy();

		if ((commerceOrder == null) ||
			(commerceDiscountApplicationStrategy == null)) {

			return _commerceMoneyFactory.create(
				commerceContext.getCommerceCurrency(), orderSubtotal);
		}

		if (!commerceOrder.isOpen()) {
			return _commerceMoneyFactory.create(
				commerceContext.getCommerceCurrency(),
				commerceOrder.getSubtotal());
		}

		String discountLevel = commerceDiscount.getLevel();

		if (Validator.isNull(discountLevel)) {
			discountLevel = CommerceDiscountConstants.LEVEL_L1;
		}

		for (CommerceOrderItem commerceOrderItem :
				commerceOrder.getCommerceOrderItems()) {

			BigDecimal[] levels = {
				BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
				BigDecimal.ZERO
			};

			if (discountLevel.equals(CommerceDiscountConstants.LEVEL_L2) ||
				discountLevel.equals(CommerceDiscountConstants.LEVEL_L3) ||
				discountLevel.equals(CommerceDiscountConstants.LEVEL_L4)) {

				levels[0] = commerceOrderItem.getDiscountPercentageLevel1();
			}

			if (discountLevel.equals(CommerceDiscountConstants.LEVEL_L3) ||
				discountLevel.equals(CommerceDiscountConstants.LEVEL_L4)) {

				levels[1] = commerceOrderItem.getDiscountPercentageLevel2();
			}

			if (discountLevel.equals(CommerceDiscountConstants.LEVEL_L4)) {
				levels[2] = commerceOrderItem.getDiscountPercentageLevel3();
			}

			BigDecimal orderItemFinalPrice =
				commerceDiscountApplicationStrategy.applyCommerceDiscounts(
					commerceOrderItem.getUnitPrice(), levels);

			orderSubtotal = orderSubtotal.add(
				orderItemFinalPrice.multiply(
					BigDecimal.valueOf(commerceOrderItem.getQuantity())));
		}

		return _commerceMoneyFactory.create(
			commerceContext.getCommerceCurrency(), orderSubtotal);
	}

	private CommerceDiscountApplicationStrategy
			_getCommerceDiscountApplicationStrategy()
		throws ConfigurationException {

		CommercePricingConfiguration commercePricingConfiguration =
			_configurationProvider.getSystemConfiguration(
				CommercePricingConfiguration.class);

		String commerceDiscountApplicationStrategyKey =
			commercePricingConfiguration.commerceDiscountApplicationStrategy();

		CommerceDiscountApplicationStrategy
			commerceDiscountApplicationStrategy =
				_commerceDiscountApplicationStrategyRegistry.get(
					commerceDiscountApplicationStrategyKey);

		if (commerceDiscountApplicationStrategy == null) {
			if (_log.isWarnEnabled()) {
				_log.warn(
					"No commerce discount application strategy specified for " +
						commerceDiscountApplicationStrategyKey);
			}
		}

		return commerceDiscountApplicationStrategy;
	}

	private static final Log _log = LogFactoryUtil.getLog(
		CartTotalCommerceDiscountRuleTypeImpl.class);

	@Reference
	private CommerceDiscountApplicationStrategyRegistry
		_commerceDiscountApplicationStrategyRegistry;

	@Reference
	private CommerceMoneyFactory _commerceMoneyFactory;

	@Reference
	private ConfigurationProvider _configurationProvider;

	@Reference
	private Language _language;

}