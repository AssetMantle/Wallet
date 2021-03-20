import React, {useState} from "react";
import {Form, Modal, OverlayTrigger, Popover} from "react-bootstrap";
import Icon from "../../components/Icon";
import success from "../../assets/images/success.svg";
import MakePersistence from "../../utils/cosmosjsWrapper";

const Send = () => {
    const [amountField, setAmountField] = useState(0);
    const [toAddress, setToAddress] = useState('');
    const [txResponse, setTxResponse] = useState('');
    const [mnemonicForm, setMnemonicForm] = useState(false);
    const [show, setShow] = useState(true);
    const handleAmount = (amount) => {
        setAmountField(amount)
    };
    const handleClose = () => {
        setShow(false);
        setMnemonicForm(false);
        setTxResponse('');
        console.log(show, mnemonicForm)
    };
    const handleAmountChange = (evt) => {
        setAmountField(evt.target.value)
    };
    const handleSubmit = async event => {
        console.log(show, mnemonicForm)
        event.preventDefault();
        setToAddress(event.target.address.value);
        setMnemonicForm(true);
        setShow(true);
    };
    const handleMnemonicSubmit = (evt) => {
        evt.preventDefault();
        const userMnemonic = evt.target.mnemonic.value;
        const mnemonic = "tank pair spray rely any menu airport shiver boost emerge holiday siege evil grace exile comfort fence mention pig bus cable scissors ability all";
        console.log(userMnemonic, "userMnemonic");
        const accountNumber = 0
        const addressIndex = 0
        const bip39Passphrase = ""
        const persistence = MakePersistence(accountNumber, addressIndex);
        const address = persistence.getAddress(userMnemonic, bip39Passphrase, true);
        const ecpairPriv = persistence.getECPairPriv(userMnemonic, bip39Passphrase);


        persistence.getAccounts(address).then(data => {
            let stdSignMsg = persistence.newStdMsg({
                msgs: [
                    {
                        type: "cosmos-sdk/MsgSend",
                        value: {
                            amount: [
                                {
                                    amount: amountField,
                                    denom: "uxprt"
                                }
                            ],
                            from_address: address,
                            to_address: toAddress
                        }
                    }
                ],
                chain_id: persistence.chainId,
                fee: {amount: [{amount: String(0), denom: "upxrt"}], gas: String(200000)},
                memo: "",
                account_number: String(data.account.account_number),
                sequence: String(data.account.sequence)
            });

            const signedTx = persistence.sign(stdSignMsg, ecpairPriv);
            persistence.broadcast(signedTx).then(response => {
                setTxResponse(response)
                console.log(response)
            });
        })
    };
    const popover = (
        <Popover id="popover-basic">
            <Popover.Content>
                The recipient’s address should start with XPRTa123…..
            </Popover.Content>
        </Popover>
    );
    return (
        <div className="send-container">
            <div className="form-section">
                <Form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <p className="label info">Recipient Address
                            <OverlayTrigger trigger="hover" placement="bottom" overlay={popover}>
                                <button className="icon-button info"><Icon
                                    viewClass="arrow-right"
                                    icon="info"/></button>
                            </OverlayTrigger></p>
                        <Form.Control
                            type="text"
                            name="address"
                            placeholder="Enter Recipient's address "
                            required={true}
                        />
                    </div>
                    <div className="form-field">
                        <p className="label">Send Amount</p>
                        <div className="amount-field">
                            <Form.Control
                                type="number"
                                name="amount"
                                placeholder="Send Amount"
                                value={amountField}
                                onChange={handleAmountChange}
                                required={true}
                            />
                            <div className="range-buttons">
                                <button type="button" className="button button-range"
                                        onClick={() => handleAmount(25000000)}>25%
                                </button>
                                <button type="button" className="button button-range"
                                        onClick={() => handleAmount(50000000)}>50%
                                </button>
                                <button type="button" className="button button-range"
                                        onClick={() => handleAmount(75000000)}>75%
                                </button>
                                <button type="button" className="button button-range"
                                        onClick={() => handleAmount(100000000)}>Max
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="buttons">
                        <button className="button button-primary">Send XPRT Tokens</button>
                    </div>
                </Form>
            </div>

            {
                mnemonicForm ?
                    <Modal show={show} onHide={handleClose} centered className="create-wallet-modal">
                        {
                            txResponse === '' ?
                                <Modal.Body className="create-wallet-body import-wallet-body">
                                    <h3 className="heading">Importing Wallet
                                    </h3>
                                    <Form onSubmit={handleMnemonicSubmit}>
                                        <p className="label">Enter Seed</p>
                                        <Form.Control as="textarea" rows={3} name="mnemonic"
                                                      placeholder="Enter Seed"
                                                      required={true}/>
                                        <div className="buttons">
                                            <button className="button button-primary">Next</button>
                                        </div>
                                    </Form>

                                </Modal.Body>
                                : <>
                                    {
                                        txResponse.code === undefined ?
                                            <>
                                                <Modal.Header className="result-header success">
                                                    Successfully Send!
                                                </Modal.Header>
                                                <Modal.Body className="delegate-modal-body">
                                                    <div className="result-container">
                                                        <img src={success} alt="success-image"/>
                                                        <p className="tx-hash">Tx Hash: {txResponse.txhash}</p>
                                                        <div className="buttons">
                                                            <button className="button">Done</button>
                                                        </div>
                                                    </div>
                                                </Modal.Body>
                                            </>
                                            : <>
                                                <Modal.Header className="result-header error">
                                                    Failed to Send
                                                </Modal.Header>
                                                <Modal.Body className="delegate-modal-body">
                                                    <div className="result-container">
                                                        <p className="tx-hash">Tx Hash:
                                                            {txResponse.txhash}</p>
                                                        <p>{txResponse.raw_log}</p>
                                                        <div className="buttons">
                                                            <button className="button" onClick={handleClose}>Done</button>
                                                        </div>
                                                    </div>
                                                </Modal.Body>
                                            </>
                                    }
                                </>
                        }

                    </Modal>
                    : null
            }
        </div>
    );
};
export default Send;