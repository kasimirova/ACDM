# Platform for selling ACDM tokens
Project includes several contracts: ACDMToken, XXXToken, Staking, DAO, ACDMPlatform.
## ACDM Platform
There are two rounds on ACDM Platform - Sale round and Trade round. Each round lasts 3 days.
In a sale round user can buy ACDM token from Platform for fixed price in ETH, in a trade round user can sell his tokens for certain price in ETH. There is also a referral program that allows users to receive reward in ETH if another user uses their address as a referal address.

## DAO

Dao allows to change some parameters:
- change freezing time for lp tokens on Staking;
- change referrer's percents on ACDM platform;
- decide what to do with Ether on commision account - send it to owner or buy XXX tokens and burn.

Amount of votes user has in DAO proposals is amount of lp tokens that he staked on a staking contract.

## Staking 
Staking receive lp tokens (XXX/ETH). User can't unstake his tokens until all proposals that he participates in are finished.

## Tasks

| Task | Description |
| ------ | ------ |
| addDao | Add dao address to staking|
| addOrder |Add order in trade round on ACDM platform|
| addproposal | Add proposal|
| buyACDM | Buy ACDM tokens on ACDM platform |
| finishproposal | Finish proposal |
| redeemOrder | Redeem order in trade round on ACDM platform |
| register | Register on ACDM platform |
| removeOrder | Remove order from ACDM platform |
| startSaleRound | Start sale round on ACDM platform |
| vote | Vote for proposal |
| unstake | Unstake tokens |
| stake | Stake tokens |
| claim | Claim reward |

## Deployed contract's addresses:

ACDMPlatform -  0x4926680B3eA9c81D5d354111745A99C7cA5fDF01
DAO - 0x1ba386ED12623F2A6e712E3b7e14006aa7D26617
Staking - 0x60D9DaA8DfBdAa069c398b053B8310ABA0EFFaC8
XXX Token - 0xBE550bf18b9E012F1425D3507f13D560ecEB7E09
Lp Token - 0x1a625f6f4067a2890fac0a11d70be9a47ff45283
ACDM Token - 0x1b099134Ca780F090C83774bb0699ee6270dAa48

Chair person address - 0x537C2BBD0856EE275bC0bE348d8Ef80a389dfE8f
