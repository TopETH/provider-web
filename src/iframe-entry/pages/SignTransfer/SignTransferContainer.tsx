import React, { FC, useEffect } from 'react';
import { SignTransfer as SignTransferComponent } from './SignTransferComponent';
import { ISignTxProps } from '../../../interface';
import { ITransferWithType, TLong } from '@waves/signer';
import { getIconType } from '../../components/IconTransfer/helpers';
import { libs } from '@waves/waves-transactions';
import { catchable } from '../../utils/catchable';
import compose from 'ramda/es/compose';
import { WAVES } from '../../constants';
import { TAssetDetails } from '@waves/node-api-js/es/api-node/assets';
import { analytics } from '../../utils/analytics';
import { useTxHandlers } from '../../hooks/useTxHandlers';
import { useTxUser } from '../../hooks/useTxUser';
import { isAlias } from '../../utils/isAlias';
import { getPrintableNumber } from '../../utils/math';

const getAssetName = (
    assets: Record<string, TAssetDetails<TLong>>,
    assetId: string | null
): string => (assetId ? assets[assetId].name : WAVES.name);

export const SignTransfer: FC<ISignTxProps<ITransferWithType>> = ({
    meta: txMeta,
    networkByte,
    tx,
    user,
    onConfirm,
    onCancel,
}) => {
    const { userName, userBalance } = useTxUser(user, networkByte);
    const amountAsset = tx.assetId === null ? WAVES : txMeta.assets[tx.assetId];
    const feeAsset =
        tx.feeAssetId === null ? WAVES : txMeta.assets[tx.feeAssetId];

    if (!amountAsset || !feeAsset) {
        throw new Error('Amount of fee asstet not found'); // TODO ?
    }

    const amount = getPrintableNumber(tx.amount, amountAsset.decimals);

    const fee = getPrintableNumber(tx.fee, feeAsset.decimals);

    const attachment = catchable(
        compose(libs.crypto.bytesToString, libs.crypto.base58Decode)
    )(tx.attachment);

    const { handleReject, handleConfirm } = useTxHandlers(
        tx,
        onCancel,
        onConfirm,
        {
            onRejectAnalyticsArgs: { name: 'Confirm_Transfer_Tx_Reject' },
            onConfirmAnalyticsArgs: { name: 'Confirm_Transfer_Tx_Confirm' },
        }
    );

    useEffect(
        () =>
            analytics.send({
                name: 'Confirm_Transfer_Tx_Show',
            }),
        []
    );

    const recipientAddress = isAlias(tx.recipient)
        ? txMeta.aliases[tx.recipient]
        : tx.recipient;

    return (
        <SignTransferComponent
            userAddress={user.address}
            userName={userName}
            userBalance={`${userBalance} Waves`}
            transferAmount={`${amount} ${getAssetName(
                txMeta.assets,
                tx.assetId
            )}`}
            transferFee={`${fee} ${getAssetName(txMeta.assets, tx.feeAssetId)}`}
            recipientAddress={recipientAddress}
            recipientName={tx.recipient}
            attachement={attachment.ok ? attachment.resolveData : ''}
            tx={tx}
            onReject={handleReject}
            onConfirm={handleConfirm}
            iconType={getIconType(tx, user, Object.keys(txMeta.aliases))}
        />
    );
};
