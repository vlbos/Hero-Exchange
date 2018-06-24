import { BigNumber } from 'bignumber.js';
import { NasTool } from '@/api';
import heroProfile from '@/config/cards.json';// '@/heroProfile.json';
import heroStatus from '../../static/herostatu.json';
import Contract from './contract';

import NebPay from 'nebpay.js';

const nebPay = new NebPay();

function getCardInfoByHeroId(id, tkId, prices) {
  const basic = heroProfile[id];
  const status = heroStatus[id];
  if (!basic) {
    console.error(`error detected id is ${id}`);
  }
  const cardImage = {
    code: id,
    front: `http://test.cdn.hackx.org/heros_new/${id}.jpeg`,
    back: `http://test.cdn.hackx.org/backs_new/${id}.jpeg`,
  };

  const res = Object.assign(basic, cardImage, status, prices);
  const result = Object.assign({ tokenId: tkId }, res);
  return result;
}

export default class LinkIdolContract extends Contract {
  constructor() {
    super({
      contractAddress: 'n1gDfiiQLEBu95xDWHGxNi4qToyXjD2vE4D',
      network: 'mainnet',
    });
  }

  async draw(referrer = '', value) {
    const t = this.call({
      functionName: 'draw',
      value: new BigNumber(value).times(1000000000000000000).toString(),
      args: [referrer],
    }).then(console.info);
    return new Promise((resolve) => {
      const result = this.send(
        {
          functionName: 'draw',
          value,
          data: [referrer],
          options: {
            callback: NebPay.config.mainnetUrl,
            listener(serialNumber, data) {
              console.log(`serialNumberrrr:${serialNumber} data: ${JSON.stringify(data)}`);
              if (data === 'Error: Transaction rejected by user' || data === false || data === true) {
                resolve('cancel');
              } else {
                resolve(serialNumber);
              }
              // 返回式样：
              // serialNumber:MiTRVkmRZOx0anWMZTgwhpJGrm50LHYr data: false (点二维码下方取消支付时显示)
              // serialNumber:MiTRVkmRZOx0anWMZTgwhpJGrm50LHYr data: "Error: Transaction rejected by user"
              // serialNumber:Nqjj6WPtQvcKxUf0OlCVRKYadqYUHI7r data: {"txhash":"f7a0316f3f7b74f493d008a6fc8f058e7b8da0238453f42a00e5c025820098ab","contract_address":""}
              // resolve(serialNumber);
            },
          },
        });
      console.log(`send: ${result}`);
    });
    // return result;
  }

  async getTokenIDsByAddress(address) {
    const result = await this.call(
      {
        functionName: 'getTokenIDsByAddress',
        args: [address],
      });
    return JSON.parse(result);
  }

  async getCardInfoByTokenId(token) {
    const heroId = await this.call(
      {
        functionName: 'getHeroIdByTokenId',
        args: [token],
      });
    return heroProfile[heroId];
  }

  async getCardsByAddress(address) {
    const result = await this.call(
      {
        functionName: 'getCardsByAddress',
        args: [address],
      });
    return JSON.parse(result);
  }

  async getUserCards(address) {
    const tokenIds = await this.getCardsByAddress(address);
    const result = await Promise.all(tokenIds.map(async info => getCardInfoByHeroId(info.heroId, info.tokenId, info.price)));
    return result;
  }

  async buyToken(id, price) {
    const value = price;
    const result = await this.send(
      {
        functionName: 'buyToken',
        value,
        data: [Number(id)],
      });
    return JSON.parse(result);
  }

  async setTokenPrice({ tokenId, value }) {
    const result = await this.send(
      {
        functionName: 'setTokenPrice',
        data: [tokenId, Number(value)],
      });
    return JSON.parse(result);
  }

  async isTokenClaimed(tokenId) { // added by Gloria
    const isTokenClaimed = await this.call({
      functionName: 'isTokenClaimed',
      args: [tokenId],
    });
    return JSON.parse(isTokenClaimed);
  }

  async ownerOf(tokenId) { // added by Dawn
    const owner = await this.call({
      functionName: 'ownerOf',
      args: [tokenId],
    });
    return JSON.parse(owner);
  }

  async priceOf(tokenId) { // added by Dawn
    const price = await this.call({
      functionName: 'priceOf',
      args: [tokenId],
    });
    return JSON.parse(price);
  }

  async getTotalSupply() { // Added by Dawn
    const total = await this.call({
      functionName: 'getTotalSupply',
    });
    if (total !== null) {
      return JSON.parse(total);
    }
    return 0;
  }
  
  async checkSerialNumber(sn) {
    return await nebPay.queryPayInfo(sn, {
      callback: NebPay.config.mainnetUrl,
    });
    // .then(function (resp) {
    //       console.log("snrespres:"+resp);
    // })
    // .catch(function (err) {
    //       console.log("snrespres:"+err);
    // });
  }
}
