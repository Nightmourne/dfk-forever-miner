import ProviderSingleton from "./provider-singleton";

const ethers = require("ethers");
import {IWallet} from "../interfaces/wallet/interface-wallet";
import TrueWallet from "./true-wallet";

const BN = require('bn.js');

const config = require('../../config.json');
const nftAbi = require("../../abis/erc20-abi.json");

export default class NftManager {
    private static _instance: NftManager;
    private callOptions = {
        gasPrice: config.transactionSettings.gasPrice,
        gasLimit: config.transactionSettings.gasLimit
    };

    public static get instance() {
        this._instance = this._instance || new this();
        return this._instance;
    }

    private getContractInstance(contractAddress: string): any {
        return new ethers.Contract(
            contractAddress,
            nftAbi,
            ProviderSingleton.instance.provider
        );
    };

    public async getTokenBalance(walletAddress: string, contractAddress: string): Promise<number> {
        const contract = this.getContractInstance(contractAddress);
        const result = await contract.balanceOf(walletAddress);
        if(result) {
            return result.toNumber();
        }
        return 0;
    }

    public async transferNftToWallet(sourceWallet: IWallet, destinationAddress: string, nftContractAddress: string, amount: number) : Promise<{ success: boolean, receipt?: any, error?: any }> {
        try {
            const contract = this.getContractInstance(nftContractAddress);
            const tx = await contract.connect(TrueWallet.instance.getWallet(sourceWallet.privateKey!)).transferFrom(
                sourceWallet.address,
                destinationAddress,
                amount,
                this.callOptions
            );

            let receipt = await tx.wait();

            if (receipt.status !== 1) {
                return {
                    success: false,
                    receipt,
                    error: null
                }
            } else {
                return {
                    success: true,
                    receipt,
                    error: null
                }
            }

        } catch (err) {
            console.log({mode: 'error', error: err});

            return {
                success: false,
                receipt: null,
                error: err
            }
        }
    }
}