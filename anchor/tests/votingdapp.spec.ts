import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from "@coral-xyz/anchor";

const IDL = require("../target/idl/votingdapp.json");
import { Votingdapp } from "@project/anchor";

const PUPPET_PROGRAM_ID = new PublicKey("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

describe('Create a system account', () => {

  test("bankrun", async () => {
    const context = await startAnchor("", [{ name: "votingdapp", programId: PUPPET_PROGRAM_ID }], []);
    const provider = new BankrunProvider(context);

    const puppetProgram = new Program<Votingdapp>(
      IDL,
      provider,
    );

    await puppetProgram.methods.initializePoll(
      new anchor.BN(1),
      new anchor.BN(0),
      new anchor.BN(1759508293),
      "description",
    ).rpc();

    // It takes seed and program id
    const [pollAddress] = PublicKey.findProgramAddressSync([
      new anchor.BN(1).toArrayLike(Buffer, 'le', 8),
    ], PUPPET_PROGRAM_ID)

    const poll = await puppetProgram.account.poll.fetch(pollAddress)

    expect(poll.pollId.toNumber()).toEqual(1)
    expect(poll.description).toEqual("description")
    expect(poll.pollStart.toNumber()).toBeLessThan(Date.now() / 1000)
    expect(poll.pollEnd.toNumber()).toBeGreaterThan(Date.now() / 1000)

  });

});
