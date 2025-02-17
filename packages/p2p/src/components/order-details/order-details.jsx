import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { Button, HintBox, Text, ThemedScrollbars } from '@deriv/components';
import { formatMoney, isDesktop } from '@deriv/shared';
import { observer } from 'mobx-react-lite';
import { Localize, localize } from 'Components/i18next';
import Chat from 'Components/orders/chat/chat.jsx';
import OrderDetailsFooter from 'Components/order-details/order-details-footer.jsx';
import OrderDetailsTimer from 'Components/order-details/order-details-timer.jsx';
import OrderInfoBlock from 'Components/order-details/order-info-block.jsx';
import OrderDetailsWrapper from 'Components/order-details/order-details-wrapper.jsx';
import P2PAccordion from 'Components/p2p-accordion/p2p-accordion.jsx';
import { useStores } from 'Stores';
import PaymentMethodAccordionHeader from './payment-method-accordion-header.jsx';
import PaymentMethodAccordionContent from './payment-method-accordion-content.jsx';
import MyProfileSeparatorContainer from '../my-profile/my-profile-separator-container';
import { setDecimalPlaces, removeTrailingZeros, roundOffDecimal } from 'Utils/format-value';
import 'Components/order-details/order-details.scss';

const OrderDetails = observer(({ onPageReturn }) => {
    const [should_expand_all, setShouldExpandAll] = React.useState(false);
    const { order_store, sendbird_store } = useStores();
    const {
        account_currency,
        advert_details,
        amount_display,
        chat_channel_url: order_channel_url,
        contact_info,
        has_timer_expired,
        id,
        is_active_order,
        is_buy_order,
        is_buyer_confirmed_order,
        is_my_ad,
        is_pending_order,
        is_sell_order,
        labels,
        local_currency,
        other_user_details,
        payment_info,
        // price, TODO: Uncomment when price is fixed
        purchase_time,
        rate,
        should_highlight_alert,
        should_highlight_danger,
        should_highlight_success,
        should_show_lost_funds_banner,
        should_show_order_footer,
        status_string,
    } = order_store?.order_information;

    const { chat_channel_url } = sendbird_store;

    React.useEffect(() => {
        const disposeListeners = sendbird_store.registerEventListeners();
        const disposeReactions = sendbird_store.registerMobXReactions();

        if (order_channel_url) {
            sendbird_store.setChatChannelUrl(order_channel_url);
        } else {
            sendbird_store.createChatForNewOrder(order_store.order_id);
        }

        return () => {
            disposeListeners();
            disposeReactions();
            order_store.setOrderPaymentMethodDetails(undefined);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const page_title =
        (is_buy_order && !is_my_ad) || (is_sell_order && is_my_ad)
            ? localize('Buy {{offered_currency}} order', { offered_currency: account_currency })
            : localize('Sell {{offered_currency}} order', { offered_currency: account_currency });

    if (sendbird_store.should_show_chat_on_orders) {
        return <Chat />;
    }

    const display_payment_amount = removeTrailingZeros(
        formatMoney(local_currency, amount_display * roundOffDecimal(rate, setDecimalPlaces(rate, 6)), true)
    );

    return (
        <OrderDetailsWrapper page_title={page_title} onPageReturn={onPageReturn}>
            {should_show_lost_funds_banner && (
                <div className='order-details--warning'>
                    <HintBox
                        icon='IcAlertWarning'
                        message={
                            <Text size='xxxs' color='prominent' line_height='xs'>
                                <Localize i18n_default_text="Don't risk your funds with cash transactions. Use bank transfers or e-wallets instead." />
                            </Text>
                        }
                        is_warn
                    />
                </div>
            )}
            <div className='order-details'>
                <div className='order-details-card'>
                    <div className='order-details-card__header'>
                        <div className='order-details-card__header--left'>
                            <div
                                className={classNames(
                                    'order-details-card__header-status',
                                    'order-details-card__header-status--info',
                                    {
                                        'order-details-card__header-status--alert': should_highlight_alert,
                                        'order-details-card__header-status--danger': should_highlight_danger,
                                        'order-details-card__header-status--success': should_highlight_success,
                                    }
                                )}
                            >
                                {status_string}
                            </div>
                            {should_highlight_success && (
                                <div className='order-details-card__message'>{labels.result_string}</div>
                            )}
                            {!has_timer_expired && (is_pending_order || is_buyer_confirmed_order) && (
                                <div className='order-details-card__header-amount'>
                                    {display_payment_amount} {local_currency}
                                </div>
                            )}
                            <div className='order-details-card__header-id'>
                                <Localize i18n_default_text='Order ID {{ id }}' values={{ id }} />
                            </div>
                        </div>
                        <div className='order-details-card__header--right'>
                            <OrderDetailsTimer />
                        </div>
                    </div>
                    <ThemedScrollbars height='unset' className='order-details-card__info'>
                        <div className='order-details-card__info-columns'>
                            <div className='order-details-card__info--left'>
                                <OrderInfoBlock
                                    label={labels.counterparty_nickname_label}
                                    value={<Text size='xs'>{other_user_details.name}</Text>}
                                />
                            </div>
                            <div className='order-details-card__info--right'>
                                <OrderInfoBlock
                                    label={labels.counterparty_real_name_label}
                                    value={`${other_user_details.first_name} ${other_user_details.last_name}`}
                                />
                            </div>
                        </div>
                        <div className='order-details-card__info-columns'>
                            <div className='order-details-card__info--left'>
                                <OrderInfoBlock
                                    label={labels.left_send_or_receive}
                                    value={`${display_payment_amount} ${local_currency}`}
                                />
                                <OrderInfoBlock
                                    label={localize('Rate (1 {{ account_currency }})', { account_currency })}
                                    value={removeTrailingZeros(formatMoney(local_currency, rate, true, 6))}
                                />
                            </div>
                            <div className='order-details-card__info--right'>
                                <OrderInfoBlock
                                    label={labels.right_send_or_receive}
                                    value={`${amount_display} ${account_currency}`}
                                />
                                <OrderInfoBlock label={localize('Time')} value={purchase_time} />
                            </div>
                        </div>
                        {is_active_order && (
                            <React.Fragment>
                                <MyProfileSeparatorContainer.Line className='order-details-card--line' />
                                {order_store?.has_order_payment_method_details ? (
                                    <div className='order-details-card--padding'>
                                        <section className='order-details-card__title'>
                                            <Text size='xs' weight='bold'>
                                                {labels.payment_details}
                                            </Text>
                                            <Button
                                                className='p2p-my-ads__expand-button'
                                                onClick={() => setShouldExpandAll(prev_state => !prev_state)}
                                                transparent
                                            >
                                                <Text size='xss' weight='bold' color='red'>
                                                    {localize('{{accordion_state}}', {
                                                        accordion_state: should_expand_all
                                                            ? 'Collapse all'
                                                            : 'Expand all',
                                                    })}
                                                </Text>
                                            </Button>
                                        </section>
                                        <P2PAccordion
                                            className='order-details-card__accordion'
                                            icon_close='IcChevronRight'
                                            icon_open='IcChevronDown'
                                            list={order_store?.order_payment_method_details?.map(payment_method => ({
                                                header: (
                                                    <PaymentMethodAccordionHeader payment_method={payment_method} />
                                                ),
                                                content: (
                                                    <PaymentMethodAccordionContent payment_method={payment_method} />
                                                ),
                                            }))}
                                            is_expand_all={should_expand_all}
                                            onChange={setShouldExpandAll}
                                        />
                                    </div>
                                ) : (
                                    <OrderInfoBlock
                                        className='order-details-card--padding'
                                        label={labels.payment_details}
                                        size='xs'
                                        weight='bold'
                                        value={payment_info || '-'}
                                    />
                                )}
                            </React.Fragment>
                        )}
                        {is_active_order && (
                            <React.Fragment>
                                <MyProfileSeparatorContainer.Line className='order-details-card--line' />
                                <OrderInfoBlock
                                    className='order-details-card--padding'
                                    label={labels.contact_details}
                                    size='xs'
                                    weight='bold'
                                    value={contact_info || '-'}
                                />
                                <MyProfileSeparatorContainer.Line className='order-details-card--line' />
                                <OrderInfoBlock
                                    className='order-details-card--padding'
                                    label={labels.instructions}
                                    size='xs'
                                    weight='bold'
                                    value={advert_details.description.trim() || '-'}
                                />
                                {should_show_order_footer && isDesktop() && (
                                    <MyProfileSeparatorContainer.Line className='order-details-card--line' />
                                )}
                            </React.Fragment>
                        )}
                    </ThemedScrollbars>
                    {should_show_order_footer && isDesktop() && (
                        <OrderDetailsFooter order_information={order_store.order_information} />
                    )}
                </div>
                {chat_channel_url && <Chat />}
            </div>
        </OrderDetailsWrapper>
    );
});

OrderDetails.propTypes = {
    chat_channel_url: PropTypes.string,
    chat_info: PropTypes.object,
    createChatForNewOrder: PropTypes.func,
    order_information: PropTypes.object,
    onCancelClick: PropTypes.func,
    popup_options: PropTypes.object,
    setChatChannelUrl: PropTypes.func,
    setShouldShowPopup: PropTypes.func,
    should_show_popup: PropTypes.bool,
    onPageReturn: PropTypes.func,
};

export default OrderDetails;
