import PropTypes from 'prop-types';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { PageError } from '@deriv/components';
import { routes } from '@deriv/shared';
import { Localize } from '@deriv/translations';

const ErrorComponent = ({
    header,
    message,
    redirect_label,
    redirectOnClick,
    should_clear_error_on_click,
    setError,
    redirect_to = routes.trade,
    should_show_refresh = true,
}) => {
    const history = useHistory();

    React.useEffect(() => {
        if (!history) return undefined;
        return history.listen(() => {
            if (typeof setError === 'function') {
                setError(false, null);
            }
        });
    }, [history, setError]);

    const refresh_message = should_show_refresh ? (
        <Localize i18n_default_text='Please refresh this page to continue.' />
    ) : (
        ''
    );

    return (
        <PageError
            header={header || <Localize i18n_default_text='Something’s not right' />}
            messages={
                message
                    ? [message, refresh_message]
                    : [
                          <Localize
                              key={0}
                              i18n_default_text='Sorry, an error occured while processing your request.'
                          />,
                          refresh_message,
                      ]
            }
            redirect_urls={[redirect_to]}
            redirect_labels={[redirect_label || <Localize i18n_default_text='Refresh' />]}
            buttonOnClick={redirectOnClick || (() => location.reload())}
            should_clear_error_on_click={should_clear_error_on_click}
            setError={setError}
        />
    );
};

ErrorComponent.propTypes = {
    header: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    message: PropTypes.oneOfType([PropTypes.node, PropTypes.string, PropTypes.object]),
    redirect_label: PropTypes.string,
    redirect_to: PropTypes.string,
    redirectOnClick: PropTypes.func,
    setError: PropTypes.func,
    should_clear_error_on_click: PropTypes.bool,
    should_show_refresh: PropTypes.bool,
    type: PropTypes.string,
};

export default ErrorComponent;
