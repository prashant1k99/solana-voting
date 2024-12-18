import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from "@coral-xyz/anchor";

const IDL = require("../target/idl/votingdapp.json");
import { Votingdapp } from "@project/anchor";

const PUPPET_PROGRAM_ID = new PublicKey("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

describe('Create a system account', () => {
  let puppetProgram: anchor.Program<Votingdapp>;

  beforeAll(async () => {

    const context = await startAnchor("", [{ name: "votingdapp", programId: PUPPET_PROGRAM_ID }], []);
    const provider = new BankrunProvider(context);

    puppetProgram = new Program<Votingdapp>(
      IDL,
      provider,
    );

  })

  test("Initialize Poll", async () => {
    await puppetProgram.methods.initializePoll(
      new anchor.BN(1),
      new anchor.BN(0),
      new anchor.BN(1759508293),
      "What type of destination you like for your trip?",
    ).rpc();

    // It takes seed and program id
    const [pollAddress] = PublicKey.findProgramAddressSync([
      new anchor.BN(1).toArrayLike(Buffer, 'le', 8),
    ], PUPPET_PROGRAM_ID)

    const poll = await puppetProgram.account.poll.fetch(pollAddress)

    expect(poll.pollId.toNumber()).toEqual(1)
    expect(poll.description).toEqual("What type of destination you like for your trip?")
    expect(poll.pollStart.toNumber()).toBeLessThan(Date.now() / 1000)
    expect(poll.pollEnd.toNumber()).toBeGreaterThan(Date.now() / 1000)
  });

  test("Initilize Candidate", async () => {
    await puppetProgram.methods.initializeCandidate(
      "Mountains",
      new anchor.BN(1),
    ).rpc()

    await puppetProgram.methods.initializeCandidate(
      "Beach",
      new anchor.BN(1),
    ).rpc()

    const [mountainAddress] = PublicKey.findProgramAddressSync([
      new anchor.BN(1).toArrayLike(Buffer, 'le', 8),
      Buffer.from("Mountains"),
    ], PUPPET_PROGRAM_ID);

    const [beachAddress] = PublicKey.findProgramAddressSync([
      new anchor.BN(1).toArrayLike(Buffer, 'le', 8),
      Buffer.from("Beach"),
    ], PUPPET_PROGRAM_ID);

    const mountainCandidate = await puppetProgram.account.candidate.fetch(mountainAddress);
    expect(mountainCandidate.candidateName).toEqual("Mountains")
    expect(mountainCandidate.candidateVotes.toNumber()).toEqual(0)

    const beachCandidate = await puppetProgram.account.candidate.fetch(beachAddress);
    expect(beachCandidate.candidateName).toEqual("Beach")
    expect(beachCandidate.candidateVotes.toNumber()).toEqual(0)
  })

  test("Initilize Voting", async () => {

  })
});
